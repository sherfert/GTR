import heapq as h

class X():
  def __lt__(self, o):
    global L

    n = len(L)
    print("len(L):", n)
    del L[-1]
    L.append(X())
    return 0

  def __del__(self):
    global L
    global gX

    print("__del__")
    gX = L[-1]
    L[:] = []

gX = None
L = [i for i in range(112233)]
h.heappush(L, X())
