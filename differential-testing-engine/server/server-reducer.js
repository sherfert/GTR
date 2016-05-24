// Author: Satia Herfert

/**
 * Different server that sends files that were found to have
 * inconsistent results to minimize them. It is important that
 * the (EXACTLY TWO) browsers exposing the inconsistency connect to this server.
 */
(function () {
    try {
        var express = require('express');
        var bodyParser = require('body-parser');
        var parser = require('ua-parser-js');
        var jsonfile = require('jsonfile');
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
    var fileRefreshSleep = config.fileRefreshSleep; // milliseconds between re-scans of codeDir
    var port = config.port;

    var fileNameToState = {};

    // File state (different from the one in server.js)
    // for minimizing code.
    function JSFileState(fileName, code) {
        this.fileName = fileName;
        this.code = code;
        this.minCode; // Minimized code
        this.haveSentTo = []; // user agent string
        this.userAgentToResults = {}; // user agent string --> result
    }

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
            sendNewFileOnceAvailable(parsedAgent, response);
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
                        var code = preprocessor.preProcess(rawCode);
                        var state = new JSFileState(file, code);
                        fileNameToState[file] = state;
                        nbNewFiles++;
                    }
                }
            }
        }
        if (nbNewFiles > 0) {
            console.log("Have read " + nbNewFiles + " new files.");
        }
        setTimeout(readCodeFromFiles, fileRefreshSleep);
    }

    /**
     * Returns a new file if available, otherwise undefined.
     */
    function getNewFile(userAgent) {
        var allFiles = Object.keys(fileNameToState);
        for (var i = 0; i < allFiles.length; i++) {
            var fileState = fileNameToState[allFiles[i]];
            if (fileState.haveSentTo.indexOf(userAgent) == -1) {
                return fileState;
            }
        }
    }

    function sendNewFileOnceAvailable(userAgent, response) {
        var fileState = getNewFile(userAgent);
        if (fileState) {
            console.log("Sent        : " + fileState.fileName + " " + userAgent + " " + new Date().toLocaleTimeString());
            fileState.haveSentTo.push(userAgent);
            response.send({
                code: fileState.code,
                fileName: fileState.fileName
            });
        } else {
            // Retry after some time, to see if now there is a new file
            setTimeout(sendNewFileOnceAvailable.bind(null, userAgent, response), fileRefreshSleep);
        }
    }

    function sendReductionRequestOnceAvailable(userAgent, response) {

    }

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

        writeResult(fileState);
    }

    // TODO same as in server.js
    function writeResult(fileState) {
        fileState.lastTested = new Date().toLocaleString();
        fs.writeFileSync("last-read.txt", fileState.fileName);
        var resultFileName = fileState.fileName + "on"; // .js --> .json
        fs.writeFileSync(codeDir + "/" + resultFileName, JSON.stringify(fileState, 0, 2));
    }

    function reduce(fileState) {
        // Called once a file was executed in 2 browsers
    }

    startServer();
    readCodeFromFiles();

})();
