var x = 23;
var y = 5;
var z = [2,{fun:function(){return 0;}},"NaN"];
var i = 0;

function foo() {
	z.push(undefined);
	while(x != y) {
		var sum = x + y;
		y++;
	}
	return z[1].fun();
}

z[++i] = {};

function unrelated(a, b, c) {
	// This function does a lot of unrelated stuff, but is not even called.
	for(var i = 0; i < 5; i++) {
		a++;
		b += c;
	}
	if(!a) {
		throw Error;
	}
	return b;
}

foo();