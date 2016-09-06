// Author: Michael Pradel

/**
 * Takes a piece of JS code, instruments it with Jalangi, and
 * appends the outcome of the execution (= a summary of all computed
 * values) as the final expression.
 */
(function () {

    var jalangi = require("../jalangi2/src/js/utils/api");

    var engineStateVarName = "__diffTestingEngineState__";
    var endOfCodeMarker = "__diffTestingEndOfCode__";

    /* jshint multistr: true */
    // The state gets an initial init element, because empty arrays do not get serialized
    // when sent back to the server.
    var template = '__diffTestingEngineState__ = { state: [{key: "init", value: "init"}], result: "noResultYet", isCrashing: false };\
    var print = function (ip) {\n\
        return console.log(ip);\
    };\
    var alert = function(ip) {\
        return console.log(ip);\
    };\
    var uneval = function(code) {\
        return code;\
    };\
    try {\
        CODE\
    } catch (e) {\
        __diffTestingEngineState__.isCrashing=true;\
        if (e instanceof TypeError) {\
            __diffTestingEngineState__.state.push({key: "Error", value: "TypeError: " + e.message});\
        } else if (e instanceof RangeError) {\
            __diffTestingEngineState__.state.push({key: "Error", value: "RangeError: " + e.message});\
        } else if (e instanceof EvalError) {\
            __diffTestingEngineState__.state.push({key: "Error", value: "EvalError: " + e.message});\
        } else if (e instanceof ReferenceError) {\
            __diffTestingEngineState__.state.push({key: "Error", value: "ReferenceError: " + e.message});\
        }\
        else if (e instanceof URIError) {\
            __diffTestingEngineState__.state.push({key: "Error", value: "URIError: " + e.message});\
        }\
        else {\
            __diffTestingEngineState__.state.push({key: "Error", value: "crash: " + e.message});\
        }\
        __diffTestingEngineState__.result = __diffTestingEngineState__.state;\
    } __diffTestingEngineState__.result;';

    function preProcess(code) {
        var instrumented = jalangi.instrumentString(code + "\n'" + endOfCodeMarker + "'");
        if (instrumented.instAST === undefined) return; // instrumentation failed; probably code is syntactically incorrect
        /* Using String.prototype.replace() will break if the insturmented code contains '$' which has special meaning */
        return template.split("CODE").join(instrumented.code);
    }

    exports.preProcess = preProcess;

})();
