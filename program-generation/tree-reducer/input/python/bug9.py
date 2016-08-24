import sys

def x():
	pass

def g(*args):
	if True: # change to True to crash interpreter
		try:			
			x()
		except:
			pass
	return g

def f():
	sys.getrecursionlimit()
	f()

import sys
sys.settrace(g)

f()
