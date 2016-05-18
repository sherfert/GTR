// Author: Satia Herfert

(function() {

    function logStr(s) {
        if(typeof s == 'number') {
            logInt(s);
        } else {
            //console.log(s);
        }
    }
    
    function logInt(i) {
        // This bug should be exposed
        if(i > 10000000000000000000000000000000000) {
            throw new Error("This is too much X.X");
        }
        //console.log("Number: " + i);
    }

    exports.logStr = logStr;

})();