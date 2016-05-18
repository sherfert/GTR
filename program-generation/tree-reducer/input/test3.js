// Author: Satia Herfert

(function() {
    // TODO adapt this path
    var logger = require("/home/satia/Projects/tree-fuzzer/program-generation/tree-reducer/input/buggyLogLib");

    function fibonacci(n) {
        if(n <= 1) {
            return 1;
        } else {
            return fibonacci(n - 1) + fibonacci(n - 2);
        }
    }

    function fibobuggy(n) {
        if(n <= 1) {
            return "1";
        } else {
            return fibobuggy(n - 1) + fibobuggy(n - 2);
        }
    }
    
    function randomErroneousFunc(num) {
        if(num % 5 == 0) {
            throw new Error("I don't like this number");
        }
    }

    // Log the differences
    var diff = 0;
    for(var i = 0; i < 10; i++)  {
        var v1= fibonacci(i);
        var v2 = fibobuggy(i);
        logger.logStr(v1 + " VS " + v2);
        diff = Math.abs(v1 - v2);
        try {
            randomErroneousFunc(v1);
        } catch(e) {
            logger.logStr("This did somehow not work");
        }
        logger.logStr(diff);
    }

})();