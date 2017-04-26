Generalized Reduction of Tree-Structured Test-Inputs
====================================================
Localizing a fault triggered by a given test input is a time-consuming
task. The well-known delta debugging algorithm and its derivatives
automate this task by repeatedly reducing the given input. Unfortunately,
these approaches are limited to blindly removing parts
of the input and cannot reduce the input by restructuring it. This
paper presents the Generalized Tree Reduction algorithm, an effective
and efficient technique to reduce arbitrary test inputs that can
be represented as a tree, such as program code, HTML pages, and
XML documents. The algorithm combines an extensible set of tree
transformations with delta debugging and a greedy backtracking
algorithm. To reduce the size of the considered search space, the approach
automatically specializes the tree transformations applied by
the algorithm based on examples of input trees. We evaluate the approach
by reducing Python files that cause interpreter crashes and
JavaScript files that cause browser inconsistencies. The algorithm
reduces these files by 50% and 96%, respectively, outperforming
both Delta Debugging and another state-of-the-art algorithm.

Prerequisites
=============
1. Clone the repository
2. Have node v6.0.0a and npm v3.8.6 or newer installed
3. Have python 3.4.3 and 2.7.6 installed
4. Install the following Python modules (recommended through pip): astor, numpy, pdfminer
5. Run './init.sh'


Folder structure
================
- **differential-testing-browsers** Needed to run the JavaScript experiment. Contains standalone browser versions.
- **differential-testing-engine** Needed to run the JavaScript experiment, 
  testing for inconsitent behavior across browsers. 
  - **inconsistentCode** Files for the JavaScript experiment
- **gtr** Implementation of GTR and other reduction algorithms.
  - **examples** Two example files that can be reduced and an example oracle
  - **tree-reducer** The algorithms
    - **input/python** Files for the Python experiment
- **program-generation** Part of TreeFuzz. Needed to infer knowledge
  and to convert JavaScript and Python files to trees.
- **pdf2tree** Independent library. A shell script that uses pdfminer's dumppdf can convert PDF to XML files. A Java executable
  can convert these XML files back to PDFs.
  
Result presentation
===================
When executing one of our two experiment (reducing PY files or reducing JS files), the result
is presented with CSV-files. The folder where these are placed is indicated below. The CSV
files are the ones we used to create the graphs in our paper and to calculate statistics like
the median reduction. The following statistics are gathered:
- **stats-inoracle.csv** For each file and algorithm, the percentage of time spent inside the oracle (See Section 5.3)
- **stats-reduction.csv** For each file and algorithm, the reduction (in percent) in terms of file size. (See Figure 3c)
- **stats-reduction-nodes.csv** For each file and algorithm, the reduction (in percent) in terms of number of nodes.
- **stats-size.csv** For each file and algorithm, the file size after running the algorithm. (See Figure 3a, 3b)
- **stats-size-nodes.csv** For each file and algorithm, the number of nodes in the tree after running the algorithm.
- **stats-tests.csv** For each file and algorithm, the number of oracle invocations. (See Figure 4)
- **stats-time.csv** For each file and algorithm, the actual runtime. (No associated graph in the paper)

The following algorithms are used:
- DD line-based (Delta Debugging, each chunk is one line)
- HDD (Hierarchical Delta Debugging)
- HDD-Star
- GTR (our algorithm)
- GTR-Star (our algorithm)
- GTR with no language information (Variant of GTR. See Section 5.4)

Reducing PY files (experiment 1)
================================
This experiment reduces Python files that lead to an interpreter crash. The artifact includes 6 of the 7 files
mentioned in the paper. The file itertools.py is excluded from the artifact. Its crash is caused by a data race
that cannot be reproduced in a VM environment (too slow). Experiment setup is detailed in Section 5.1,
Sections 5.2, 5.3, 5.4 contain the results.

1. Navigate to the folder 'gtr'
2. Run './python-loop.sh'. This creates JSON files with information for each algoritm in 'gtr/tree-reducer/input/python'. This will take up to a couple of hours.
3. To gather statistics, run 'node createPyStats.js'. They will be placed in 'gtr/tree-reducer/input/python/stats'


Reducing JS files (experiment 2)
================================
This experiment reduces JavaScript files that expose browser inconsistencies. All 41 files mentioned in the paper
are included. Experiment setup is detailed in Section 5.1, Sections 5.2, 5.3, 5.4 contain the results.

1. Navigate to the folder 'differential-testing-engine'
2. Run 'node server/server-reducer.js'. This creates JSON files with information for each algoritm in 'differential-testing-engine/inconsistentCode/'
   When prompted by chrome before it launches, hit OK. This will take a long time in a VM (expect multiple hours).
3. To gather statistics, run 'node util/createStats.js'. They will be placed in 'differential-testing-engine/inconsistentCode/stats'


Reducing files with your own oracle
===================================
You can play around with GTR (and other reduction algorithms) and reduce your own JavaScript
or Python files with your own oracles, written as shell scripts. We provided two example files
and one example oracle.

1. Checkout the example oracle 'gtr/example/grepOracle.sh'.
2. Navigate to the folder 'gtr'
3. Example 1 'node shell-reducer.js -a HDD -l PY -f examples/ex1.py examples/grepOracle.sh examples/output.py' reduces ex1.py with HDD using the grep oracle.
4. Example 2 'node shell-reducer.js -a GTR -l JS -f examples/ex2.js examples/grepOracle.sh examples/output.js' reduces ex2.js with GTR using the grep oracle.
5. You can vary which algorithm to use and use your own files and oracles.


Inferring knowledge
===================
This step is not necessary to reproduce our results. The knowledge we inferred is already included
in the algorithm, placed in the folder 'gtr/tree-reducer/inferredRules'. If you want to use your own
corpus to infer knowledge, like described in Section 4.2, follow these steps.

1. Place your corpus files in 'program-generation/corpusForTestingJS' for JavaScript or 'program-generation/corpusForTestingPy' for Python. Do not use subfolders.
2. Navigate to the folder 'gtr'
3. Run 'node analyzeCorpus.js PY' or 'node analyzeCorpus.js JS'
   This places the inferred knowledge in ./program-generation/results/inferredKnowledge/
   It also places a learning curve CSV there. (See Figure 5)