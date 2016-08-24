import io

class File(io.RawIOBase):
    def readinto(self, buf):
        global view
        view = buf
    def readable(self):
        return True

f = io.BufferedReader(File())
f.read(1)                       # get view of buffer used by BufferedReader
del f                           # deallocate buffer
view = view.cast('P')
L = [None] * len(view)          # create list whose array has same size
                                # (this will probably coincide with view)
view[0] = 0                     # overwrite first item with NULL
L[0]                            # segfault: dereferencing NULL