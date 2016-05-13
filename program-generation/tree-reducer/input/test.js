var x = 23;
var y = 5;
var z = [2,5,"NaN"];
function foo() {
	while(x != y) {
		y++;
	}
	return z[2].fun();
}
foo();