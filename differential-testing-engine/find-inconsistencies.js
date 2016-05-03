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
    var pathToread = currentDir + "/ourfuzz-3250-2/old/";
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
        },
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
            if (resultsummary === "SYNTAX_ERROR") {
                createWorkingDirectory(pathToWrite + 'syntax-error/');
                fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWrite + 'syntax-error/' + filenameInJSON));
                fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWrite + 'syntax-error/' + filenameInJSON + "on"));
            }
            if (resultsummary === "CONSISTENT") {
                if (isCrashing) {
                    crashingNonCrashing.consistent.crashing++;
                    createWorkingDirectory(pathToWrite + 'consistent-crashing/');
                    fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWrite + 'consistent-crashing/' + filenameInJSON));
                    fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWrite + 'consistent-crashing/' + filenameInJSON + "on"));
                } else {
                    crashingNonCrashing.consistent.non_crashing++;
                    createWorkingDirectory(pathToWrite + 'consistent-non-crashing/');
                    fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWrite + 'consistent-non-crashing/' + filenameInJSON));
                    fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWrite + 'consistent-non-crashing/' + filenameInJSON + "on"));
                }
            }

            if (filenameInJSON.indexOf("funfuzz") === -1) {
                nooffile++;
                recordResultSummary["ourfuzz"].hasOwnProperty(resultsummary) ? recordResultSummary["ourfuzz"][resultsummary] += 1 : recordResultSummary["ourfuzz"][resultsummary] = 1;
            } else {
                nooffunfuzzfiles++;
                recordResultSummary["funfuzz"].hasOwnProperty(resultsummary) ? recordResultSummary["funfuzz"][resultsummary] += 1 : recordResultSummary["funfuzz"][resultsummary] = 1;
            }

            /* Write the JS & JSON files to interesting programs if inconsistent */
            if (resultsummary === "INCONSISTENT" && isCrashing) {
                crashingNonCrashing.in_consistent.crashing++;
                // if (!skipFile(filenameInJSON)) {
                /* Source --> Destination */
                createWorkingDirectory(pathToWrite + 'inconsistent-crashing/');
                fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWrite + 'inconsistent-crashing/' + filenameInJSON));
                fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWrite + 'inconsistent-crashing/' + filenameInJSON + "on"));
                //fs.writeFileSync("./differential-testing-results/inconsistent/" + filenameInJSON, json.code);
                console.log("Inconsistent --> " + filenameInJSON);
                incosistent = true;
                /*   } else {
                 console.log("Skipping file " + filenameInJSON);
                 }*/
            } else if (resultsummary === "INCONSISTENT" && !isCrashing) {
                crashingNonCrashing.in_consistent.non_crashing++;
                createWorkingDirectory(pathToWrite + 'inconsistent-non-crashing/');
                fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWrite + 'inconsistent-non-crashing/' + filenameInJSON));
                fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWrite + 'inconsistent-non-crashing/' + filenameInJSON + "on"));
                //fs.writeFileSync("./differential-testing-results/inconsistent/" + filenameInJSON, json.code);
                console.log("Inconsistent --> " + filenameInJSON);
                incosistent = true;
            }
            /* Write the JS file if non-deterministic */
            else if (resultsummary === "NON-DETERMINISTIC") {
                if (!skipFile(filenameInJSON)) {
                    //fs.writeFileSync("./differential-testing-results/non-deterministic/" + filenameInJSON, json.code);
                    createWorkingDirectory(pathToWrite + 'non-deterministic/');
                    fs.createReadStream(pathToread + filenameInJSON).pipe(fs.createWriteStream(pathToWrite + 'non-deterministic/' + filenameInJSON));
                    fs.createReadStream(pathToread + filenameInJSON + "on").pipe(fs.createWriteStream(pathToWrite + 'non-deterministic/' + filenameInJSON + "on"));
                    console.log("Non-deterministic --> " + filenameInJSON);
                    incosistent = true;
                } else {
                    console.log("Skipping file " + filenameInJSON);
                }
            }
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
