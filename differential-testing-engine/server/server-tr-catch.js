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
(function() {

    var express = require('express');
    var bodyParser = require('body-parser');
    var fs = require('fs');

    var preprocessor = require('./tryCatchPreProcessor.js');
    //var preprocessor = require('./jalangiPreprocessor.js');

    var codeDir = "generatedCode-tr-catch";
    var fileRefreshSleep = 2000; // milliseconds between re-scans of codeDir
    var repetitionsPerBrowser = 5;

    var fileNameToState = {};

    function JSFileState(fileName, code /*undefined means syntax error in code*/ ) {
        this.fileName = fileName;
        this.code = code;
        this.haveSentTo = {}; // user agent string --> number
        this.userAgentToResults = {}; // user agent string --> array of results
        this.resultSummary = code ? "WAITING_FOR_EXECUTION" : "SYNTAX_ERROR";
    }

    JSFileState.prototype = {
        updateResultSummary: function() {
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

        app.get('/getCode', function(request, response) {
            var userAgent = request.headers['user-agent'];
            console.log("Got request from " + userAgent);
            sendNewFileOnceAvailable(userAgent, response);
        });

        app.post('/reportResult', function(request, response) {
            var userAgent = request.headers['user-agent'];
            var fileName = request.body.fileName;
            var result = request.body.result;
            if (request.body.library !== "nil") {
                userAgent = userAgent + " + " + request.body["library"];
            }
            handleResponse(fileName, userAgent, result);
            console.log("Received result: " + result + " for " + fileName);
            response.send("OK");
        });

        var server = app.listen(4001, function() {
            var host = server.address().address;
            var port = server.address().port;

            console.log("Server listing at http://%s:%s", host, port);
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
                        var code = preprocessor.preProcess(rawCode);
                        var state = new JSFileState(file, code);
                        fileNameToState[file] = state;
                        writeResult(state);
                        nbNewFiles++;
                    }
                }
            }
        }
        if (nbNewFiles > 0) console.log("Have read " + nbNewFiles + " new files.");

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
            console.log("Found a new file for " + userAgent + " -- " + fileState.fileName + ". Sending it to client...");
            var oldHaveSentTo = fileState.haveSentTo[userAgent] | 0;
            fileState.haveSentTo[userAgent] = oldHaveSentTo + 1;
            response.send({
                code: fileState.code,
                fileName: fileState.fileName
            });
        } else {
            setTimeout(sendNewFileOnceAvailable.bind(null, userAgent, response), fileRefreshSleep);
        }
    }

    function handleResponse(fileName, userAgent, result) {
        var fileState = fileNameToState[fileName];
        if (!fileState)
            throw "Error: Received response for unknown file " + fileName;

        if (!fileState.userAgentToResults.hasOwnProperty(userAgent)) fileState.userAgentToResults[userAgent] = [];
        fileState.userAgentToResults[userAgent].push(result);

        fileState.updateResultSummary();

        writeResult(fileState);
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
        return result1 === result2; // to revise if we have a richer representation of results
    }

    function writeResult(fileState) {
        var resultFileName = fileState.fileName + "on"; // .js --> .json
        fs.writeFileSync(codeDir + "/" + resultFileName, JSON.stringify(fileState, 0, 2));
    }

    startServer();
    readCodeFromFiles();

})();
