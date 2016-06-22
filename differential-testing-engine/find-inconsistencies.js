/**
 * Author: Jibesh Patra
 * Date:  02.11.15 Time: 23:08
 */
tryin = 0;

var fs = require('fs');
var jsonfile = require('jsonfile');

function runner(argument) {
    var path = require('path');
    var currentDir = process.cwd();
    var pathToread = currentDir + "/gen20160622/";
    var pathToWrite = './differential-testing-results/';
    createWorkingDirectory(pathToWrite);
    //var pathToread = currentDir + "/generatedCode-tr-catch/";
    var recordResultSummary = {
        "ourfuzz": {},
        "funfuzz": {}
    };

    var crashingNonCrashing = {
        consistent: {
            crashing: 0,
            non_crashing: 0
        },
        in_consistent: {
            crashing: 0,
            non_crashing: 0
        }
    };


    var allfiles = fs.readdirSync(pathToread),
        incosistent = false,
        nooffile = 0,
        nooffunfuzzfiles = 0;
    Object.keys(allfiles).forEach(function (file) {
        if (path.parse(pathToread + '/' + allfiles[file]).ext === ".json") {
            var json = jsonfile.readFileSync(pathToread + '/' + allfiles[file]);
            var filenameInJSON = json.fileName;
            var resultsummary = json.resultSummary;
            var isCrashing = JSON.parse(json.isCrashing);
            let pathToWriteFile;

            if (filenameInJSON.indexOf("funfuzz") === -1) {
                nooffile++;
                recordResultSummary["ourfuzz"].hasOwnProperty(resultsummary) ? recordResultSummary["ourfuzz"][resultsummary] += 1 :
                                                                               recordResultSummary["ourfuzz"][resultsummary] = 1;
            } else {
                nooffunfuzzfiles++;
                recordResultSummary["funfuzz"].hasOwnProperty(resultsummary) ? recordResultSummary["funfuzz"][resultsummary] += 1 :
                                                                               recordResultSummary["funfuzz"][resultsummary] = 1;
            }


            if (resultsummary === "SYNTAX_ERROR") {
                pathToWriteFile = pathToWrite + 'syntax-error/';
            } else if (resultsummary === "CONSISTENT") {
                if (isCrashing) {
                    crashingNonCrashing.consistent.crashing++;
                    pathToWriteFile = pathToWrite + 'consistent-crashing/';
                } else {
                    crashingNonCrashing.consistent.non_crashing++;
                    pathToWriteFile = pathToWrite + 'consistent-non-crashing/';
                }
            } else if (resultsummary === "INCONSISTENT") {
                incosistent = true;
                console.log("Inconsistent --> " + filenameInJSON);

                if (isCrashing) {
                    crashingNonCrashing.in_consistent.crashing++;
                    pathToWriteFile = pathToWrite + 'inconsistent-crashing/';
                } else {
                    crashingNonCrashing.in_consistent.non_crashing++;
                    pathToWriteFile = pathToWrite + 'inconsistent-non-crashing/';
                }
            } else if (resultsummary === "NON-DETERMINISTIC") {
                incosistent = true;
                console.log("Non-deterministic --> " + filenameInJSON);

                pathToWriteFile = pathToWrite + 'non-deterministic/';
            }

            // Write the files to the corresponding folders
            createWorkingDirectory(pathToWriteFile);
            fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWriteFile+ filenameInJSON));
            fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWriteFile + filenameInJSON + "on"));

        }
    });
    // console.log("\n" + tryin++ + ".");
    // if (!incosistent) console.log("No inconsistencies found");
    console.log("Summary of \n\t" + nooffile + " files " +
        "from ourfuzz \n and \n\t" + nooffunfuzzfiles + " files from funfuzz\n");
    console.log(recordResultSummary);
    console.log(crashingNonCrashing);
    // console.log("Waiting to check again in few seconds ....");
}
runner();
// setInterval(runner, 70000);

function createWorkingDirectory(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}
/* Skip the files that has been already manually inspected before. */
function skipFile(seenFile) {
    return false; // FIXME: temporary work-around
    var inspectedFiles = jsonfile.readFileSync('inspected-files.json');
    var listOfFiles = Object.keys(inspectedFiles);
    if (listOfFiles.indexOf(seenFile) === -1) {
        return false;

    } else {
        return true;
    }
}
