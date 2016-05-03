// Author: Michael Pradel

/*
 Jalangi2 analysis that tracks values computed during the execution
 and summarizes them into a global variable.
 */

(function (sandbox) {
    function ExecutionSummarizer() {

        var primitiveTypes = ["boolean", "number", "string", "null", "undefined"];

        function toString(value) {
            //var t = $.type(value);
            var t = typeof value;
            if (primitiveTypes.indexOf(t) !== -1) return String(value);
            else return t;
        }

        function addToState(value) {
            __diffTestingEngineState__.state.push(toString(value));
        }
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid) {
            return {
                f: f,
                base: base,
                args: args,
                skip: false
            };
        };


        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid) {
            return {
                result: result
            };
        };


        this.literal = function (iid, val, hasGetterSetter) {
            if (val === "__diffTestingEndOfCode__") {
                __diffTestingEngineState__.result = __diffTestingEngineState__.state.toString();
            } else {
                addToState("Literal: ");
                addToState(val);
            }
            return {
                result: val
            };
        };

        this.forinObject = function (iid, val) {
            return {
                result: val
            };
        };


        this.declare = function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
            return {
                result: val
            };
        };


        this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall) {
            return {
                base: base,
                offset: offset,
                skip: false
            };
        };


        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            return {
                result: val
            };
        };


        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign) {
            return {
                base: base,
                offset: offset,
                val: val,
                skip: false
            };
        };

        this.putField = function (iid, base, offset, val, isComputed, isOpAssign) {
            addToState("Putfield: ");
            addToState(val);
            return {
                result: val
            };
        };

        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            return {
                result: val
            };
        };

        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            addToState("Write: ");
            addToState(val);
            return {
                result: val
            };
        };

        this._return = function (iid, val) {
            addToState("Return: ");
            addToState(val);
            return {
                result: val
            };
        };

        this._throw = function (iid, val) {
            addToState("Throw: ");
            addToState(val);
            return {
                result: val
            };
        };

        this._with = function (iid, val) {
            return {
                result: val
            };
        };

        this.functionEnter = function (iid, f, dis, args) {
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            return {
                returnVal: returnVal,
                wrappedExceptionVal: wrappedExceptionVal,
                isBacktrack: false
            };
        };

        this.scriptEnter = function (iid, instrumentedFileName, originalFileName) {
        };

        this.scriptExit = function (iid, wrappedExceptionVal) {
            return {
                wrappedExceptionVal: wrappedExceptionVal,
                isBacktrack: false
            };
        };

        this.binaryPre = function (iid, op, left, right, isOpAssign, isSwitchCaseComparison, isComputed) {
            return {
                op: op,
                left: left,
                right: right,
                skip: false
            };
        };

        this.binary = function (iid, op, left, right, result, isOpAssign, isSwitchCaseComparison, isComputed) {
            addToState("Binary: ");
            addToState(result);
            return {
                result: result
            };
        };

        this.unaryPre = function (iid, op, left) {
            return {
                op: op,
                left: left,
                skip: false
            };
        };

        this.unary = function (iid, op, left, result) {
            addToState("Unary: ");
            addToState(op);
            return {
                result: result
            };
        };

        this.conditional = function (iid, result) {
            addToState("Conditional: ");
            addToState(result);
            return {
                result: result
            };
        };

        this.instrumentCodePre = function (iid, code) {
            return {
                code: code,
                skip: false
            };
        };

        this.instrumentCode = function (iid, newCode, newAst) {
            return {
                result: newCode
            };
        };

        this.endExpression = function (iid) {
        };

        this.endExecution = function () {
        };

    }
    sandbox.analysis = new ExecutionSummarizer();
})(J$);
