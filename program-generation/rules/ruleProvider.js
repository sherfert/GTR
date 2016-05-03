// Author: Michael Pradel

(function() {

    var config = require("./../config").config;

    function rules() {
        var result = [];
        for (var i = 0; i < config.ruleNames.length; i++) {
            var ruleName = config.ruleNames[i];
            var rule = require("./" + ruleName);
            rule.name = ruleName; // attach name (useful for debugging)
            result.push(rule);
        }
        return result;
    }

    exports.rules = rules;
    exports.dontCare = "__don't care__";

})();