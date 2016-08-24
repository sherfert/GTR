from marshal import loads, dumps
from itertools import chain
import new

def fun(x):
    return lambda : x + 5

code_args = [ getattr(fun.func_code, a)
              for a in ( 'co_argcount', 
                         'co_nlocals',
                         'co_stacksize',
                         'co_flags',
                         'co_code',
                         'co_consts', 
                         'co_names',
                         'co_varnames',
                         'co_filename',
                         'co_name',
                         'co_firstlineno',
                         'co_lnotab'       ) ]

from pprint import pprint
# Strangely, the crash went away when I comment out the call to pprint
# below.
pprint(code_args)

code = new.code(*code_args)
mcopy_code = loads(dumps(code))

new_fun = new.function(mcopy_code, globals())
print new_fun(5)()
