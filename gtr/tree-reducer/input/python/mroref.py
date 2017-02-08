class MyKey(object):
    def __hash__(self):
        return hash('mykey')

    def __cmp__(self, other):
        X.__bases__ = (Base2,)
        z = []
        for i in range(1000):
            z.append((i, None, None))
        return -1


class Base(object):
    mykey = 'from Base'

class Base2(object):
    mykey = 'from Base2'


X = type('X', (Base,), {MyKey(): 5})

print X.mykey