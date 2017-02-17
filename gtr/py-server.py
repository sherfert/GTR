import os
import subprocess
from flask import Flask, jsonify

app = Flask("pyserver")

# This file is currently not used!

@app.route('/run/<string:prog>/<string:arg>', methods=['GET'])
def get_runpython(prog, arg):
    FNULL = open(os.devnull, 'w')
    child = subprocess.Popen([prog, "/tmp/" + arg], stdout=FNULL, stderr=FNULL, close_fds=True)
    try:
        child.communicate(timeout = 1)
    except subprocess.TimeoutExpired:
        return jsonify(1)
    cleanup1 = subprocess.Popen(["rm", "/tmp/" + arg])
    cleanup2 = subprocess.Popen(["pkill", "python2.7"])
    cleanup3 = subprocess.Popen(["pkill", "python3.4"])
    cleanup1.communicate(timeout = 1)
    cleanup2.communicate(timeout = 1)
    cleanup3.communicate(timeout = 1)
    return jsonify(child.returncode)



app.run(port=9000)