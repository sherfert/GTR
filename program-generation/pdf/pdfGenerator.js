const child_process = require('child_process');
const xmlGenerator = require('../xml/xmlGenerator');
const fs = require('fs');

function treeToCode(tree) {
    let xmlStr = xmlGenerator.treeToCode(tree);
    fs.writeFileSync("GTR-another.xml", xmlStr);
    // XML -> PDF
    var result = child_process.spawnSync("java -jar ../pdf2tree/target/pdf2tree-1.0-SNAPSHOT-jar-with-dependencies.jar", [], {
        input: xmlStr,
        shell: true,
        timeout: 500,
        killSignal: 'SIGKILL'
    });
    //console.log(result.stderr + '');
    return result.stdout;
}

// Just to be compatible with the previous archticture...
function treeToCodeNoFileIO(tree) {
    return treeToCode(tree);
}

exports.treeToCode = treeToCode;
exports.treeToCodeNoFileIO = treeToCodeNoFileIO;