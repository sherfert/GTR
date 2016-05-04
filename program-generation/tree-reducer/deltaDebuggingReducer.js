// Author: Satia Herfert

(function() {

    function TextInput(text) {
        this.text = text;
        this.tokens = Array.from("" + text);
        this.activeTokenMap = Array.from(Array(this.tokens.length)).map(() => true);
    }
    TextInput.prototype.setActiveTokens = function(map) {
        // Copy the values into the internal map
        for (var i = 0; i < map.length; i++) {
            this.activeTokenMap[i] = map[i];
        }
    };
    TextInput.prototype.getCurrentCode = function() {
        var str = "";
        for (var i = 0; i < this.tokens.length; i++) {
            if(this.activeTokenMap[i]) {
                str = str + this.tokens[i];
            }
        }
        return str;
    }

    function ddminTree(tree) {
        return tree;
    }

    function ddminChar(text) {
        return ddmin(new TextInput(text));
    }

    function ddmin(input) {
        // The input is given as either TextInput or TreeInput

        // The initial map has true in every position
        var map = Array.from(Array(input.tokens.length)).map(() => true);

        for (var i = 0; i < input.tokens.length / 2; i++) {
            map[i] = false;
        }
        input.setActiveTokens(map);

        // After each step, we need to run a syntax checker and a crash checker

        return input.getCurrentCode();
    }

    exports.ddminTree = ddminTree;
    exports.ddminChar = ddminChar;
})();