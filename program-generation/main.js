// Author: Michael Pradel, Jibesh Patra

(function() {
    var checkWorkingDirectories = require('./util').checkWorkingDirectories;

    var learning = require("./learning");
    var generation = require("./generation");
    var timer = require("./evaluation/timer");

    checkWorkingDirectories();
    //timer.startTask("learning");
    learning.learn();
    //timer.stopTask("learning");
    //timer.startTask("generation");
    //generation.generate();
    //timer.stopTask("generation");

})();