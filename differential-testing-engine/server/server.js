// Author: Michael Pradel

/**
 * Server part of differential testing engine.
 * Executes .js files added to the codeDir directory in multiple browsers
 * and writes .json files with the results into the same directory.
 *
 * The engine executes each file in each browser to find inconsistencies between browsers.
 * Moreover, the engine executes each file twice per browser to find non-deterministic tests.
 *
 * Assumptions:
 *  - New .js files are added to the codeDir directory, but .js files are never deleted.
 */
(function () {
    try {
        var express = require('express');
        var bodyParser = require('body-parser');
        var onelog = require('single-line-log').stdout;
        var jsonfile = require('jsonfile');
    } catch (err) {
        console.log(err.message);
        console.log("Can't continue until you fix above error/s..");
        process.exit(1);
    }
    var fs = require('fs');
    var util = require('./util-server');

    /* Configurations */
    var config = jsonfile.readFileSync("config.json");
    var preprocessor = require(config.preprocessor);
    var codeDir = config.codeDirectory;
    var fileRefreshSleep = config.fileRefreshSleep; // milliseconds between re-scans of codeDir
    var repetitionsPerBrowser = config.repetitionsPerBrowser;
    var port = config.port;
    var useEval = config.useEval;


    var fileNameToState = {};

    function JSFileState(fileName, code /*undefined means syntax error in code*/) {
        this.fileName = fileName;
        this.code = code;
        this.haveSentTo = {}; // user agent string --> number
        this.userAgentToResults = {}; // user agent string --> array of results
        this.isCrashing = false;
        this.resultSummary = code ? "WAITING_FOR_EXECUTION" : "SYNTAX_ERROR";
    }

    JSFileState.prototype = {
        updateResultSummary: function () {
            var userAgents = Object.keys(this.userAgentToResults);
            // check for non-determinism
            for (var i = 0; i < userAgents.length; i++) {
                var results = this.userAgentToResults[userAgents[i]];
                if (!resultsAreConsistent(results)) {
                    this.resultSummary = "NON-DETERMINISTIC";
                    return;
                }
            }

            // compare browsers with each other
            if (userAgents.length > 1) {
                var results = [];
                for (var i = 0; i < userAgents.length; i++) {
                    var userAgentFirstResult = this.userAgentToResults[userAgents[i]][0];
                    results.push(userAgentFirstResult);
                }
                if (resultsAreConsistent(results)) this.resultSummary = "CONSISTENT";
                else this.resultSummary = "INCONSISTENT";
            }
        }
    };

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
            //console.log("Got request from " + userAgent);
            sendNewFileOnceAvailable(parsedAgent, response);
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
            onelog("Received    : " + fileName + " " + parsedAgent + " " + new Date().toLocaleTimeString());
            //console.log("Received result: " + result + " for " + fileName);
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
        /* TODO
         /!* Pre-process the readfiles and select only JS files *!/

         /!* Sort the files by names *!/
         allFiles.sort(function (i, j) {
         return i < j ? -1 : 1;
         });
         var lastReadFile = fs.readFileSync("last-read.txt", "utf8");
         /!* Remove files that has already been processed *!/
         var idx = allFiles.indexOf(lastReadFile);
         if (idx !== -1) {
         allFiles.slice(idx + 1);
         }*/
        //console.log("Not processing " + idx + " files before " + lastReadFile);
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
                        var code = preprocessor.preProcess(rawCode);
                        var state = new JSFileState(file, code);
                        fileNameToState[file] = state;
                        util.writeResult(codeDir, state);
                        nbNewFiles++;
                    }
                }
            }
        }
        if (nbNewFiles > 0) {
            onelog("Have read " + nbNewFiles + " new files.");
        }

        setTimeout(readCodeFromFiles, fileRefreshSleep);
    }

    function getNewFile(userAgent) {
        var allFiles = Object.keys(fileNameToState);
        for (var i = 0; i < allFiles.length; i++) {
            var fileState = fileNameToState[allFiles[i]];
            if (fileState.resultSummary !== "SYNTAX_ERROR" &&
                (!fileState.haveSentTo.hasOwnProperty(userAgent) || fileState.haveSentTo[userAgent] < repetitionsPerBrowser)) {
                return fileState;
            }
        }
    }

    function sendNewFileOnceAvailable(userAgent, response) {
        var fileState = getNewFile(userAgent);
        if (fileState) {
            onelog("Sent        : " + fileState.fileName + " " + userAgent + " " + new Date().toLocaleTimeString());
            //console.log("Found a new file for " + userAgent + " -- " + fileState.fileName + ". Sending it to client...");
            var oldHaveSentTo = fileState.haveSentTo[userAgent] | 0;
            fileState.haveSentTo[userAgent] = oldHaveSentTo + 1;
            response.send({
                code: fileState.code,
                fileName: fileState.fileName,
                useEval: useEval
            });
        } else {
            setTimeout(sendNewFileOnceAvailable.bind(null, userAgent, response), fileRefreshSleep);
        }
    }

    function handleResponse(fileName, userAgent, result) {
        var fileState = fileNameToState[fileName];
        if (!fileState) {
            throw "Error: Received response for unknown file " + fileName;
        }

        if (!fileState.userAgentToResults.hasOwnProperty(userAgent)) {
            fileState.userAgentToResults[userAgent] = [];
        }
        fileState.userAgentToResults[userAgent].push(result['result']);
        /* If it crashes in atleast one of the browsers then set it to true */
        if (JSON.parse(result['isCrashing'])) {
            fileState.isCrashing = result['isCrashing'];
        }
        fileState.updateResultSummary();

        util.writeResult(codeDir, fileState);
    }

    function resultsAreConsistent(results) {
        for (var i = 0; i < results.length; i++) {
            var result1 = results[i];
            for (var j = i + 1; j < results.length; j++) {
                var result2 = results[j];
                if (!twoResultsAreConsistent(result1, result2)) return false;
            }
        }
        return true;
    }

    function twoResultsAreConsistent(result1, result2) {
        // to revise if we have a richer representation of results
        return JSON.stringify(result1) === JSON.stringify(result2);
    }

    startServer();
    readCodeFromFiles();

})();
