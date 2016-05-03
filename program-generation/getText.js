/**
 * Created by Jibesh Patra on 14 March, 2016.
 *
 */
(function() {
    "use strict";
    var config = require('./config').config;
    var getCodePreamble = require("./getCodePreamble").getCodePreamble;
    var learning = require("./learning");
    let currentDateTime;

    var fileType = config.fileType;

    function getText(context, options) {
        switch (context) {
            case "LogPreamble_generation":
                currentDateTime = new Date();
                return "\nGeneration started at " + currentDateTime + "\n\tUsing corpus " + config.corpusDir + " containing " + learning.getCorpusSize() + " files";
                break;
            case "LogConclusion_generation":
                var logConclusion;
                currentDateTime = new Date();
                if (Array.isArray(options) && options.length !== 0) {
                    var requiredValidTree = options[0];
                    var treeNb = options[1];
                    var syntacticallyValidPrograms = options[2];
                    var nonCrashingPrograms = options[3];
                    var surplus = treeNb - requiredValidTree;

                    logConclusion = "\n\tTrees asked to generate : " + requiredValidTree +
                        "\n\tGenerated Trees : " + treeNb +
                        "\n\tSurplus needed : " + surplus +
                        "\n\tSyntactically valid programs: " + syntacticallyValidPrograms +
                        "\n\tNon crashing programs: " + nonCrashingPrograms +
                        "\nFinished at " + currentDateTime;
                } else {
                    logConclusion = "\nInsufficient program executions to write log";
                }
                return logConclusion;
                break;
            case "fixedSeed":
                return "\nSeed is fixed at " + config.fixedSeed + ".\nuseRandomSeed is set to 'false' in the config. Will " +
                    "not generate the same program more than once. " + "\nTo generate anyway, set forceSameProgramGeneration " +
                    "to 'true' in the config.\n";
                break;
            case "codePreamble":
                return getCodePreamble(fileType, options);
                break;
            case "Traversal_start":
                currentDateTime = new Date();
                return "\nTraversal started " + currentDateTime;
                break;
            case "Traversal_end":
                currentDateTime = new Date();
                return "\nTraversal ended " + currentDateTime;
                break;
            case "Finalized_rules":
                currentDateTime = new Date();
                return "\nFinalized rules " + currentDateTime;
                break;
            case "Processing_files":
                currentDateTime = new Date();
                return "\n\nProcessing files started " + currentDateTime;
                break;
            default:
                return '';
        }
    }

    exports.getText = getText;

})();
