import io


class X(io.TextIOWrapper): 
    __slots__ = u'name'
x = X(open(u'/dev/null'))
x.name = x
repr(x)
