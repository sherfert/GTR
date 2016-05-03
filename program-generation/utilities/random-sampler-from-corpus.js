/**
 * Created by Jibesh Patra on 17 March, 2016.
 * Time: 18:14
 */

(function () {
    "use strict";
    let fs = require('fs');
    const seedrandom = require('seedrandom');

    let seed = 1000;
    let random = seedrandom(seed);
    let inputDirectory = "../corpusForTestingJS/alexa800/";
    let outputDirectory = "../corpusForTestingJS/sampledCorpus/";

    let numberOfFilesToSample = 1000;

    /* Only process if directory */
    if (fs.lstatSync(inputDirectory).isDirectory()) {
        let files = fs.readdirSync(inputDirectory);
        if (files.length < numberOfFilesToSample) {
            console.log("Not enough files to sample");
            return;
        }
        for (var i = 0; i < numberOfFilesToSample; i++) {
            /* Create output directory if it does not exist */
            if (!fs.existsSync(outputDirectory)) {
                fs.mkdirSync(outputDirectory);
            }
            let randNum = parseInt(random() * files.length, 10);
            let file = files[randNum];
            let inoutFilePath = inputDirectory + file, outputFilePath = outputDirectory + file;

            if (!fs.lstatSync(inoutFilePath).isDirectory()) { // Skip directories in the inputDirectory
                let code = fs.readFileSync(inoutFilePath, 'utf8');

                if (fs.existsSync(outputFilePath)) {
                    i--;
                } else {
                    fs.writeFileSync(outputFilePath, code);
                }
            } else {
                i--;
            }
        }
    } else {
        console.log(inputDirectory + " is not a directory");
    }

})();

