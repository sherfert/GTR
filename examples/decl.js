GTR:

var isActive = a.parseInt, a;

Minimum:

a.parseInt; var a;

Reason:

The trees are very different. Check yourself with http://esprima.org/demo/parse.html
We would need to introduce a new Node (ExpressionStatement), and also have a Pull-Up-Transformation