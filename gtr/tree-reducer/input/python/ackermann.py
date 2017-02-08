import sys
sys.setrecursionlimit(100000)
resultset = {}

def ackermann(m, n):
    if (m, n) in resultset:
        return resultset[(m, n)]
    if (m == 0):
        ans = (n + 1);
    elif (n == 0):
        ans = ackermann((m - 1), 1)
    else:
        ans = ackermann((m - 1), ackermann(m, (n - 1)))
    if (m != 0):
        resultset[(m, n)] = ans
    return ans;
for i in range(0,10) :
    for j in range(0,10) :
        print("ackermann(%d, %d): " % (i, j) + str(ackermann(i, j)))