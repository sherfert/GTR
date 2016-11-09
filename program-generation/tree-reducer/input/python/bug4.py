import sys, traceback


class MyException(Exception):
  
    def __init__(self, *args):
        raise MyException
      
try:
    from mymodule import MyException
except ImportError:
    pass

def gen():
    f = open(__file__)
    yield

def foo():
    try:
        g = gen()
        next(g)
        sys.setrecursionlimit(len(traceback.extract_stack()))
        foo()
    finally:
        g.throw(MyException)

foo()
