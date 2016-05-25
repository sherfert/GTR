// Author: Satia Herfert

/**
 * Different server that sends files that were found to have
 * inconsistent results to minimize them. It is important that
 * the (EXACTLY TWO) browsers exposing the inconsistency connect to this server.
 *
 * TODO forbid more than nbBrowsers connections?
 */
(function () {
    try {
        var express = require('express');
        var bodyParser = require('body-parser');
        var parser = require('ua-parser-js');
        var jsonfile = require('jsonfile');
        var deasync = require('deasync');
    } catch (err) {
        console.log(err.message);
        console.log("Can't continue until you fix above error/s..");
        process.exit(1);
    }
    var fs = require('fs');
    var ddReducer = require("../../program-generation/tree-reducer/deltaDebuggingReducer");

    /* Configurations */
    var config = jsonfile.readFileSync("config.json");
    var preprocessor = require(config.preprocessor);
    var codeDir = config.reduceCodeDirectory;
    var reduceRefreshSleep = config.reduceRefreshSleep; // milliseconds between re-scans of the the queue
    var nbBrowsers = config.educeBrowsersExpected;
    var port = config.port;

    var fileNameToState = {};
    var listOfAgents = [];
    var reducerQueue = {};

    // File state (different from the one in server.js)
    // for minimizing code.
    function JSFileState(fileName, rawCode) {
        this.fileName = fileName;
        this.rawCode = rawCode;
        this.testCode; // Current instrumented code
        this.minCode; // Minimized code
        this.userAgentToResults = {}; // user agent string --> result
    }

    /**
     * Starts the server. The API consists of
     * GET /getCode that will return a piece of code to test and
     * POST /resportResult that must be used to report the results of tested code.
     */
    function startServer() {
        var app = express();
        app.use(express.static('client'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        app.get('/getCode', function (request, response) {
            var userAgent = request.headers['user-agent'];
            var parsedAgent = parsedUserAgent(userAgent);

            // Save the agent name
            if(listOfAgents.indexOf(parsedAgent) < 0) {
                console.log("First connection of " + parsedAgent);
                listOfAgents.push(parsedAgent);
                reducerQueue[parsedAgent] = [];
            }

            sendReductionRequestOnceAvailable(parsedAgent, response);
        });

        app.post('/reportResult', function (request, response) {
            var userAgent = request.headers['user-agent'];
            var fileName = request.body.fileName;
            var result = request.body.result;

            var parsedAgent = parsedUserAgent(userAgent);
            if (request.body.hasOwnProperty("library") && request.body.library !== "nil") {
                parsedAgent = parsedAgent + " + " + request.body["library"];
            }

            handleResponse(fileName, parsedAgent, result);
            response.send("OK");
        });

        var server = app.listen(port, function () {
            var host = server.address().address;
            var port = server.address().port;

            console.log("\nServer listening at http://%s:%s", host, port);
        });
    }

    // TODO same as in server.js: Abstract into a library
    function parsedUserAgent(userAgent) {
        var ua = parser(userAgent);
        var parsedUa = "-";
        if (ua) {
            if (ua.hasOwnProperty("browser")) {
                parsedUa = ua.browser.name + " ";
                parsedUa += ua.browser.version;
            }
            if (ua.hasOwnProperty("os")) {
                parsedUa = parsedUa + " (" + ua.os.name + ")";
            }
            return parsedUa;
        } else {
            return userAgent;
        }
    }

    // TODO essentially the same as in server.js
    function readCodeFromFiles() {
        var nbNewFiles = 0;
        var allFiles = fs.readdirSync(codeDir);
        for (var i = 0; i < allFiles.length; i++) {
            var file = allFiles[i];
            if (file.indexOf(".js") === file.length - 3) {
                var stats = fs.statSync(codeDir + "/" + file);
                if (stats.isFile()) {
                    if (!fileNameToState.hasOwnProperty(file)) {
                        // .js file that has not yet been read --> read it now
                        var rawCode = fs.readFileSync(codeDir + "/" + file, {
                            encoding: "utf8"
                        });
                        var state = new JSFileState(file, rawCode);
                        fileNameToState[file] = state;
                        nbNewFiles++;
                    }
                }
            }
        }
        if (nbNewFiles > 0) {
            console.log("Have read " + nbNewFiles + " new files.");
        }
    }

    // TODO similar as in server.js
    function handleResponse(fileName, userAgent, result) {
        var fileState = fileNameToState[fileName];
        if (!fileState) {
            throw "Error: Received response for unknown file " + fileName;
        }

        if (!fileState.userAgentToResults.hasOwnProperty(userAgent)) {
            fileState.userAgentToResults[userAgent] = result['result'];
        }
        /* If it crashes in atleast one of the browsers then set it to true */
        if (JSON.parse(result['isCrashing'])) {
            fileState.isCrashing = result['isCrashing'];
        }
    }

    // TODO same as in server.js
    function writeResult(fileState) {
        fileState.lastTested = new Date().toLocaleString();
        fs.writeFileSync("last-read.txt", fileState.fileName);
        var resultFileName = fileState.fileName + "on"; // .js --> .json
        fs.writeFileSync(codeDir + "/" + resultFileName, JSON.stringify(fileState, 0, 2));
    }

    /**
     * Reschedules itself if there is no pending request in the queue.
     * Otherwise, pops the first request (for this agent) and sends it to the client.
     * @param userAgent the user agent name
     * @param response the response object to send data to the client
     */
    function sendReductionRequestOnceAvailable(userAgent, response) {
        if(reducerQueue[userAgent].length == 0) {
            // Retry after some time, to see if now there is a new request
            setTimeout(sendReductionRequestOnceAvailable.bind(null, userAgent, response), reduceRefreshSleep);
            return;
        }

        var request = reducerQueue[userAgent].shift();
        var fileState = fileNameToState[request.name];
        console.log("Sent: " + fileState.fileName + ":" + request.number + " " + userAgent);
        response.send({
            code: fileState.testCode,
            fileName: fileState.fileName
        });
    }


    /**
     * Reduces the code of one file using HDD to a hopefully smaller piece of code
     * that exposes the same inconsistency.
     *
     * @param fileState the fileState of the file to minimize.
     */
    function reduce(fileState) {
        var counter = 0;
        // This functions tests given code in browsers
        // and waits until all have returned a result
        var testInBrowsers = function(c) {
            // Update the code
            fileState.minCode = c;
            fileState.testCode = preprocessor.preProcess(fileState.minCode);
            // Instrumentation can fail. In that case we have undefined results
            if(!fileState.testCode) {
                return undefined;
            }

            console.log("testing code of " + fileState.fileName + " iteration " + counter);
            var request = {
                name:fileState.fileName,
                number: counter++
            };
            // Push the request to the queue for all agents
            for (var i = 0; i < listOfAgents.length; i++) {
                var agent = listOfAgents[i];
                reducerQueue[agent].push(request);
            }

            // Wait for the results from the browsers
            var res = fileState.userAgentToResults;
            deasync.loopWhile(function() {
                return Object.keys(res).length < nbBrowsers;
            });
            // Remove the results for the next iteration
            fileState.userAgentToResults = {};
            // Return the results
            return res;
        };

        console.log("Starting reduction of " + fileState.fileName);
        // First, send the original code to the browsers to have results for the comparison
        var originalResults = testInBrowsers(fileState.rawCode);
        var cmpWith = JSON.stringify(originalResults);
        console.log("Got initial results: " + cmpWith);

        var test = function(c) {
            var res = testInBrowsers(c);
            var s = JSON.stringify(res);
            console.log("Got more results: " + s);
            if(s === cmpWith) {
                // Same inconsistency
                return "fail"
            }
            // All other cases, we do not care further
            return "?";
        };
        fileState.minCode = ddReducer.executeWithCode(ddReducer.hdd, fileState.rawCode, test);
        // Restore original results
        fileState.userAgentToResults = originalResults;
        // Write to file
        writeResult(fileState);
        console.log("Reduction done of " + fileState.fileName);
    }

    /**
     * Reducing all files found, one after the other.
     */
    function reduceAllFiles() {
        for (var key in fileNameToState) {
            if (fileNameToState.hasOwnProperty(key)) {
                reduce(fileNameToState[key]);
            }
        }
    }

    startServer();
    readCodeFromFiles();
    // Invoke reduce as soon as two browsers have connected.
    console.log("Waiting for browsers to connect");
    deasync.loopWhile(function() { return listOfAgents.length < nbBrowsers; });
    reduceAllFiles();

})();
