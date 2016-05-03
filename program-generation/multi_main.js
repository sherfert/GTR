/**
 * Created by Jibesh Patra on 14 March, 2016.
 * Spawn multiple learning and generation depending on the number of CPUs.
 * --max_old_space_size = specifies the amount of memory assigned to each spawned process
 */
var spawn = require('child_process').spawn;
const numCPUs = require('os').cpus().length;
var config = require('./config').config;

/* TODO: Pass the number of CPUs to main.js which in turn is passed to generate function.
 *  This way, we can limit the number of generated process. Now generating more programs than we ask for.
 *  Also, if two generated files get written at the same time. De we need to explicitly handle any race conditions?
 * */
(function () {
    for (var i = 0; i < numCPUs; i++) {
        var sp = spawn('node', ['--max_old_space_size=7000', 'main.js'], {
            cwd: process.cwd(),
            stdio: 'inherit'
        });
    }
}());