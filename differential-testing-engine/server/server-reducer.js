// Author: Satia Herfert

/**
 * Different server that sends files that were found to have
 * inconsistent results to minimize them. It is important that
 * the (EXACTLY TWO) browsers exposing the inconsistency connect to this server.
 *
 * XXX forbid more than nbBrowsers connections.
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
    var Tester = require("../../program-generation/tree-reducer/inputTester").Tester;
    var treeProvider = require("../../program-generation/js-ast/jsAstProvider");
    var treeGenerator = require("../../program-generation/js-ast/jsAstGenerator");
    var execWithCode = require("../../program-generation/tree-reducer/ddMinTree").executeWithCode;
    var hdd = require("../../program-generation/tree-reducer/hdd");
    var modelHdd = require("../../program-generation/tree-reducer/modelHdd");
    var rdd = require("../../program-generation/tree-reducer/rdd");
    var ddminLine = require("../../program-generation/tree-reducer/ddMinLine").ddminLine;
    var ddminChar = require("../../program-generation/tree-reducer/ddMinChar").ddminChar;
    var btLine = require("../../program-generation/tree-reducer/btLine").btLine;
    var bth = require("../../program-generation/tree-reducer/bth");
    var bthta = require("../../program-generation/tree-reducer/bth-ta");
    var util = require('./util-server');

    /* Configurations */
    var config = jsonfile.readFileSync("config.json");
    var preprocessor = require(config.preprocessor);
    var codeDir = config.reduceCodeDirectory;
    var reduceRefreshSleep = config.reduceRefreshSleep; // milliseconds between re-scans of the the queue
    var nbBrowsers = config.reduceBrowsersExpected;
    var port = config.port;
    var useEval = config.useEval;

    var fileNameToState = {};
    var listOfAgents = [];
    var reducerQueue = {};

    // File state (different from the one in server.js)
    // for minimizing code.
    function JSFileState(fileName, rawCode) {
        this.fileName = fileName;
        this.rawCode = rawCode;
        this.origSize = rawCode.length;
        this.userAgentToResults = {}; // user agent string --> result
        this.results = {}; // minimization results with different algorithms
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
                        // Obtain the old fileState or create a new one
                        fileNameToState[file] = util.getFileState(codeDir, file, rawCode) || new JSFileState(file, rawCode);
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
        //console.log("RES: \n" + JSON.stringify(result, 0, 2));
        
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
            fileName: fileState.fileName,
            useEval: useEval
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
            return "fail";
        }
        // All other cases, we do not care further
        return "?";
    }

    /**
     * Advanced oracle for delta debugging. Uses the given filestate to compare the results.
     *
     * In comparison to the basic version this:
     * - Ignores R/W when having a crash vs. non-crash difference
     * - Only considers the first encountered difference in the traces.
     *
     * @param {String} c the code to evaluate using the oracle
     * @param {object} cmpWith the result to compare with (object obtained from invoking getExecutionDifferences)
     * @param {JSFileState} fileState the fileState of the file to test
     * @returns {String} "fail" or "?"
     */
    function advancedTestOracle(c, cmpWith, fileState) {
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
     * XXX This function compares execution difference by serializing two maps
     * of traces ("agent" -> trace) and comparing the JSON strings. This is not very
     * effective and only works if the agents are always listed in the same order, which
     * seems to hold.
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

        var trace0 = traces[agent0];
        var trace1 = traces[agent1];

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
     */
    function equalDiffObjects(e0, e1) {
        return JSON.stringify(e0) === JSON.stringify(e1);
    }

    /**
     * Reduces the code of one file using HDD (or other tree algorithm) to a hopefully smaller piece of code
     * that exposes the same inconsistency.
     *
     * @param {JSFileState} fileState the fileState of the file to minimize.
     * @param algorithm a function reference to the algorithm to use
     * @param {String} algoPrefix the prefix to use for the given algorithm for the JSON file
     * @param treeAlgo true, if algorithm refers to a tree-based algorith; false, if it refers to a code-based algorithm
     */
    function reduce(fileState, algorithm, algoPrefix, treeAlgo) {
        console.log("Starting reduction of " + fileState.fileName);

        // First, send the original code to the browsers to have results for the comparison
        var originalResults = testInBrowsers(fileState.rawCode, fileState);
        var cmpWith = getExecutionDifferences(originalResults);
        console.log("Got initial results: " + JSON.stringify(cmpWith));
        fileState.diff = cmpWith;

        // DD algorithm
        var ddAlgo;
        if(treeAlgo) {
            ddAlgo = function(code, test) {
                return execWithCode(treeProvider, treeGenerator, algorithm, code, test);
            };
        } else {
            ddAlgo = function(code, test) {
                return algorithm(code, test);
            };
        }

        // Test function that just expects code, so we can pass it to DD
        var test = function(c) {
            //console.log("TESTING: " + c);
            return advancedTestOracle(c, cmpWith, fileState);
        };

        var tester = new Tester(test, ddAlgo);
        fileState.results[algoPrefix] = {};
        fileState.results[algoPrefix].minCode  = tester.runTest(fileState.rawCode);
        fileState.results[algoPrefix].size  = fileState.results[algoPrefix].minCode.length;
        fileState.results[algoPrefix].testsRun = tester.testsRun;
        fileState.results[algoPrefix].timeTaken = `${tester.timeTaken[0] * 1e9 + tester.timeTaken[1]}`;
        console.log("Num tests: " + tester.testsRun + ` in ${fileState.results[algoPrefix].timeTaken} nanoseconds`);

        // Restore original results
        fileState.userAgentToResults = originalResults;
        // Write to file
        util.writeResult(codeDir, fileState);
        // Also write minimized code
        //fs.writeFileSync(codeDir + "/min/min-" + fileState.fileName, fileState.minCode);
        console.log("Reduction done of " + fileState.fileName);
    }

    /**
     * Reducing all files found, one after the other.
     *
     * @param algorithm a function reference to the algorithm to use
     * @param {String} algoPrefix the prefix to use for the given algorithm for the JSON file
     * @param treeAlgo true, if algorithm refers to a tree-based algorith; false, if it refers to a code-based algorithm
     */
    function reduceAllFiles(algorithm, algoPrefix, treeAlgo) {
        var totalTimeMS = 0;
        for (var key in fileNameToState) {
            if (fileNameToState.hasOwnProperty(key)) {
                reduce(fileNameToState[key], algorithm, algoPrefix, treeAlgo);
                // Accumulate total time taken
                totalTimeMS += (fileNameToState[key].results[algoPrefix].timeTaken / 1000000);
            }
        }
        console.log(`Total time: ${totalTimeMS.toFixed(0)} milliseconds with ${algoPrefix}`);
    }

    startServer();
    readCodeFromFiles();
    // Invoke reduce as soon as n browsers have connected.
    console.log("Waiting for browsers to connect");
    deasync.loopWhile(function() { return listOfAgents.length < nbBrowsers; });

    // DDMin line
    //reduceAllFiles(ddminLine, "DD line-based", false);

    // DDMin char
    //reduceAllFiles(ddminChar, "DD char-based", false);

    // BT line
    //reduceAllFiles(btLine, "BT line-based", false);

    // HDD and the like
    // reduceAllFiles(hdd.hdd, "HDD", true);
     reduceAllFiles(hdd.hddStar, "HDD*", true);

    //reduceAllFiles(bth.bth, "BTH", true);

    // Model-HDD(*)
    // var plt = (pTree, pTest) => modelHdd.postLevelTransformationHdd("JS", pTree, pTest, false);
    // reduceAllFiles(plt, "HDD with child substitution", true);
    //var pltS = (pTree, pTest) => modelHdd.postLevelTransformationHddStar("JS", pTree, pTest, false);
    //reduceAllFiles(pltS, "HDD* with child substitution", true);
    // var pltSA = (pTree, pTest) => modelHdd.postLevelTransformationHddStar("JS", pTree, pTest, true);
    // reduceAllFiles(pltSA, "HDD* with any substitution", true);

    // var gtr = (pTree, pTest) => bthta.bthta("JS", pTree, pTest, false);
    // reduceAllFiles(gtr, "GTR", true);
    // var gtrS = (pTree, pTest) => bthta.bthtaStar("JS", pTree, pTest, false);
    // reduceAllFiles(gtrS, "GTR*", true);

})();
