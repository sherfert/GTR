// Author: Michael Pradel

(function() {

    const completedTasks = [];
    const nameToTask = new Map();

    function Task(name) {
        this.name = name;
        this.startTime = new Date();
        this.stopTime = undefined;
    }

    Task.prototype = {
        durationInMillis:function() {
            return this.stopTime.getTime() - this.startTime.getTime();
        }
    };

    function startTask(name) {
        var task = new Task(name);
        nameToTask.set(name, task);
        // console.log("TIMER: Starting " + name + " at " + new Date());
    }

    function stopTask(name) {
        var task = nameToTask.get(name);
        if (task === undefined) {
            console.log("TIMER warning: Asked to stop task that doesn't exist: " + name);
        } else {
            task.stopTime = new Date();
            nameToTask.delete(name);
            completedTasks.push(task);
            return task.durationInMillis();
            // console.log("TIMER: " + task.name + " took " + task.durationInMillis() + " ms");
        }
    }

    exports.startTask = startTask;
    exports.stopTask = stopTask;

})();