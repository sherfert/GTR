var x = 23;
var y = 5;
var z = [2,5,"NaN"];
function foo() {
	if(x != y) {
		y++;
		x = z;
	}
	return z[2].fun();
}
foo();