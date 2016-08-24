#import functools
#x = functools.partial(min)
#x.__setstate__((x, (), {}, {}))
#repr(x)

#import xml.etree.ElementTree
#x = xml.etree.ElementTree.Element('')
#x.tag = x
#repr(x)

import io
class X(io.TextIOWrapper): __slots__ = 'name'
x = X(open('/dev/null'))
x.name = x
repr(x)