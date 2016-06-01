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
        var jsonfile = require('jsonfile');
        var deasync = require('deasync');
    } catch (err) {
        console.log(err.message);
        console.log("Can't continue until you fix above error/s..");
        process.exit(1);
    }
    var fs = require('fs');
    var ddReducer = require('../../program-generation/tree-reducer/deltaDebuggingReducer');
    var util = require('./util-server');

    /* Configurations */
    var config = jsonfile.readFileSync("config.json");
    var preprocessor = require(config.preprocessor);
    var codeDir = config.reduceCodeDirectory;
    var reduceRefreshSleep = config.reduceRefreshSleep; // milliseconds between re-scans of the the queue
    var nbBrowsers = config.reduceBrowsersExpected;
    var port = config.port;

    var fileNameToState = {};
    var listOfAgents = [];
    var reducerQueue = {};

    // File state (different from the one in server.js)
    // for minimizing code.
    function JSFileState(fileName, rawCode) {
        this.fileName = fileName;
        this.rawCode = rawCode;
        this.userAgentToResults = {}; // user agent string --> result
        // Listings fields here that are used later
        this.testCode = undefined; // Current instrumented code
        this.minCode = undefined; // Minimized code
        this.minCode2 = undefined; // Further minimized code (some improvements over minCode)

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
            var parsedAgent = util.parsedUserAgent(userAgent);

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

            var parsedAgent = util.parsedUserAgent(userAgent);
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

    function handleResponse(fileName, userAgent, result) {
        var fileState = fileNameToState[fileName];
        if (!fileState) {
            throw "Error: Received response for unknown file " + fileName;
        }

        if (!fileState.userAgentToResults.hasOwnProperty(userAgent)) {
            fileState.userAgentToResults[userAgent] = result['result'];
        }
        /* If it crashes in at least one of the browsers then set it to true */
        if (JSON.parse(result['isCrashing'])) {
            fileState.isCrashing = result['isCrashing'];
        }
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
        response.send({
            code: fileState.testCode,
            fileName: fileState.fileName
        });
    }

    /**
     * This functions tests given code in browsers
     * and waits until all have returned a result
     *
     * @param {String} c the code to test
     * @param {JSFileState} fileState the fileState of the file to test.
     * @returns {object} (user agent string --> result) for all browsers
     */
    function testInBrowsers(c, fileState) {
        // Update the code
        fileState.testCode = preprocessor.preProcess(c);
        // Instrumentation can fail. In that case we have undefined results
        if(!fileState.testCode) {
            return undefined;
        }

        // At the moment a request is just defined by the filename.
        // Using an object in case this gets more complex.
        var request = {
            name:fileState.fileName
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
    }

    /**
     * Oracle for delta debugging. Uses the given filestate to compare the results.
     *
     * @param {String} c the code to evaluate using the oracle
     * @param {String} cmpWith the result to compare with (JSON of browser results)
     * @param {JSFileState} fileState the fileState of the file to test
     * @returns {String} "fail" or "?"
     */
    function testOracle(c, cmpWith, fileState) {
        // Obtain results for the given code
        var res = testInBrowsers(c, fileState);
        // Convert to JSON to compare with original results
        var s = JSON.stringify(res);
        if(s === cmpWith) {
            // Same inconsistency
            return "fail"
        }
        // All other cases, we do not care further
        return "?";
    }

    /**
     * Advanced oracle for delta debugging. Uses the given filestate to compare the results.
     *
     * In comparison to the basic version this:
     * - Ignores R/W when having a crash vs. non-crash difference
     * - TODO more improvements
     *
     * @param {String} c the code to evaluate using the oracle
     * @param {object} cmpWith the result to compare with (object obtained from invoking getExecutionDifferences)
     * @param {JSFileState} fileState the fileState of the file to test
     * @returns {String} "fail" or "?"
     */
    function advancedTestOracle(c, cmpWith, fileState) {
        console.log("TESTING");
        // Obtain results for the given code
        var res = testInBrowsers(c, fileState);
        // Get diff to compare with original results
        var s = getExecutionDifferences(res);
        if(equalDiffObjects(s,cmpWith)) {
            // Same inconsistency
            return "fail";
        }
        // All other cases, we do not care further
        return "?";
    }

    /**
     * XXX This function assumes exactly two traces to compare. Not more, not less.
     *
     * It looks at the two execution traces obtainted by jalangi and isolates the first
     * difference. In the case where only one of the traces ends with a crash, the other
     * trace is irrelevant.
     *
     * @param traces
     */
    function getExecutionDifferences(traces) {
        var agent0 = listOfAgents[0];
        var agent1 = listOfAgents[1];

        var result = {};
        // The traces may be undefined, in which case we don't have a difference
        if(!traces) {
            result[agent0] = {};
            result[agent1] = {};
            return result;
        }

        var trace0 = JSON.parse(traces[agent0]);
        var trace1 = JSON.parse(traces[agent1]);

        // Iterate through the entries
        for(let i = 0; i < Math.max(trace0.length, trace1.length); i++) {
            let elem0 = trace0[i];
            let elem1 = trace1[i];
            // Replace undefined with dummy objects (lists can have different lengths)
            if(!elem0) { elem0 = {};}
            if(!elem1) { elem1 = {};}

            if(!equalTraceElements(elem0, elem1)) {
                // Test if it is Error vs. non-Error
                if(elem0.key == "Error" && elem1.key != "Error") {
                    result[agent0] = elem0;
                    result[agent1] = {};
                } else if(elem0.key != "Error" && elem1.key == "Error") {
                    result[agent0] = {};
                    result[agent1] = elem1;
                } else {
                    result[agent0] = elem0;
                    result[agent1] = elem1;
                }
                return result;
            }
        }

        // If we reach that point, no difference was found
        result[agent0] = {};
        result[agent1] = {};
        return result;
    }

    /**
     * Compares two trace elements (key value pairs) and return true if they are equal.
     */
    function equalTraceElements(e0, e1) {
        return JSON.stringify(e0) === JSON.stringify(e1);
    }

    /**
     * Compares two diff objects obtained from getExecutionDifferences
     * TODO is the order deterministic!?
     */
    function equalDiffObjects(e0, e1) {
        return JSON.stringify(e0) === JSON.stringify(e1);
    }

    /**
     * Reduces the code of one file using HDD to a hopefully smaller piece of code
     * that exposes the same inconsistency.
     *
     * @param {JSFileState} fileState the fileState of the file to minimize.
     */
    function reduce(fileState) {
        console.log("Starting reduction of " + fileState.fileName);
        // First, send the original code to the browsers to have results for the comparison
        var originalResults = testInBrowsers(fileState.rawCode, fileState);
        var cmpWith = JSON.stringify(originalResults);
        console.log("Got initial results: " + cmpWith);

        // Test function that just expects code, so we can pass it to DD
        var test = function(c) {
          return testOracle(c, cmpWith, fileState);
        };
        fileState.minCode = ddReducer.executeWithCode(ddReducer.hdd, fileState.rawCode, test);
        //fileState.minCode = ddReducer.ddminLine(fileState.rawCode, test);

        // Apply the more advanced oracle in a second run
        // console.log("Further reduction with advanced oracle.");
        // var originalResults2 = testInBrowsers(fileState.minCode, fileState);
        // var cmpWith2 = getExecutionDifferences(originalResults2);
        // console.log("Got initial results: " + JSON.stringify(cmpWith2));
        // var test2 = function(c) {
        //     return advancedTestOracle(c, cmpWith2, fileState);
        // };
        // fileState.minCode2 = ddReducer.executeWithCode(ddReducer.hdd, fileState.minCode, test2);


        // Restore original results
        fileState.userAgentToResults = originalResults;
        // Write to file
        util.writeResult(codeDir, fileState);
        // Also write minimized code
        fs.writeFileSync(codeDir + "/min/min-" + fileState.fileName, fileState.minCode);
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
    // Invoke reduce as soon as n browsers have connected.
    console.log("Waiting for browsers to connect");
    deasync.loopWhile(function() { return listOfAgents.length < nbBrowsers; });
    reduceAllFiles();


})();