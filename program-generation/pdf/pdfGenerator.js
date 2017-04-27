const tmp = require('tmp');
var child_process = require('child_process');

const xmlGenerator = require('../xml/xmlGenerator');

function treeToCode(tree) {
    let xmlStr = xmlGenerator.treeToCode(tree);
    // TODO XML -> PDF
    let file = tmp.fileSync({prefix: 'conversion-', postfix: '.xml'});
    fs.writeFileSync(file.name, code);
    var result = child_process.spawnSync("(echo '<?xml version=\"1.1\"?>' ; dumppdf -a -t " + file.name + ") | sed -e 's/&#0;//g' ", [], {
        shell: true,
        timeout: 500,
        killSignal: 'SIGKILL'
    });
    return null;
}

// Just to be compatible with the previous archticture...
function treeToCodeNoFileIO(tree) {
    return treeToCode(tree);
}



exports.treeToCode = treeToCode;
exports.treeToCodeNoFileIO = treeToCodeNoFileIO;