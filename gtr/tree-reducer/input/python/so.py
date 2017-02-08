import numpy.random as nprnd
import heapq
import sys

sys.setrecursionlimit(10**6)


def rlist(size, limit_low, limit_high):
    for _ in xrange(size): 
        yield nprnd.randint(limit_low, limit_high)

def iterator_mergesort(iterator, size):
    return heapq.merge(
         iterator_mergesort(
           (iterator.__next__ for _ in xrange(size/2)), size/2),
         iterator_mergesort(
            iterator, size - (size/2))
       )

def test():
    size = 10**3
    randomiterator = rlist(size, 0, size)
    sortediterator = iterator_mergesort(randomiterator, size)
    assert sortediterator == sorted(randomiterator)

if __name__ == '__main__':
    test()