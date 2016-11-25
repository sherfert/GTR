GTR:

{
  var a;
  try {
  } catch (e) {
    function a() {
    }
  }
}


Minimum:

{
  var a;
  function a() { 
  } 
}

Reason:

We would need a Replace-With-Grandchild transformation.