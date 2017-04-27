/**
 * Created by Jibesh Patra on 26-Apr-2017.
 */

const fs = require('fs');
var child_process = require('child_process');
const config = require("./../config").config;
const xmlProvider = require('../xml/xmlProvider');

let fileNames = [];
let currentIndex = -1;

function init() {
    let filepath = config.corpusDir;
    let files = fs.readdirSync(filepath);
    const maxFiles = config.maxNoOfFilesToLearnFrom;

    if (maxFiles > 0) {
        files = files.slice(0, maxFiles);
    }

    for (let i = 0; i < files.length; i++) {
        let file = filepath + "/" + files[i];
        if (!fs.lstatSync(file).isDirectory()) { // Skip directories
            fileNames.push(file);
        }
    }
    console.log("Found " + fileNames.length + " files.");
}


function codeToTree(code) {
    var result = child_process.spawnSync("(echo '<?xml version=\"1.1\"?>' ; dumppdf -a -t " + file.name + ") | sed -e 's/&#0;//g' ", [], {
        shell: true,
        timeout: 500,
        killSignal: 'SIGKILL'
    });
    let xmlStr = result.stdout;
    return xmlProvider.codeToTree(xmlStr + '');
}


function nextTree() {
    while (currentIndex < fileNames.length - 1) {
        currentIndex++;
        console.log("Remaining >> " + parseInt(((fileNames.length - currentIndex) / fileNames.length) * 100) +
            "%  Processing: " + fileNames[currentIndex]);
        var content = fs.readFileSync(fileNames[currentIndex]);
        try {
            // let tre = codeToTree(content);
            // console.log(tre.toString());
            return codeToTree(content);
        } catch (e) {
            // console.log("Error" + e);
            // Will repeat while loop until a file can be parsed successfully
        }
    }
}

exports.init = init;
exports.nextTree = nextTree;
exports.codeToTree = codeToTree;