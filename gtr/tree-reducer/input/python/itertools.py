from __future__ import print_function
import itertools
try:
    from queue import Queue
except ImportError:
    from Queue import Queue
from threading import Thread
from collections import deque
from threading import Lock
try:
    from itertools import izip
except ImportError:
    izip = zip
try:
    xrange
except NameError:
    xrange = range

number_of_items = 1000

def tee(iterable, n=2):
    it = iter(iterable)
    deques = [deque() for i in range(n)]
    def gen(mydeque):
        while True:
            if not mydeque:
                newval = next(it)
                for d in deques:
                    d.append(newval)
            yield mydeque.popleft()
    return tuple(gen(d) for d in deques)

class LockedIterator(object):
    def __init__(self, it):
        self.lock = Lock()
        self.it = iter(it)

    def __iter__(self): return self

    def __next__(self):
        with self.lock:
            return next(self.it)

    next = __next__


class IterableQueue(Queue):

    _sentinel = object()
    _lock  = Lock()

    def __init__(self, *args, **kwargs):
        Queue.__init__(self, *args, **kwargs)

    def __iter__(self):
        return iter(self.get, self._sentinel)

    def close(self):
        self.put(self._sentinel)


def printer(iterable, name):
    for _, item in izip(iterable, xrange(number_of_items-1)):
        print(name, item)

q = IterableQueue()
for i in xrange(number_of_items):
    q.put(i)

a, b = itertools.tee(LockedIterator(q))

Thread(target=printer, args=(a,"a:")).start()
Thread(target=printer, args=(b,"b:")).start()