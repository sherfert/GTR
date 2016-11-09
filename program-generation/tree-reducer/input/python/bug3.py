import io


class File(io.RawIOBase):
  
    def readinto(self, buf):
        global view
        view = buf
        
    def readable(self):
        return True

f = io.BufferedReader(File())
f.read(1)
del f
view = view.cast('P')
L = [None] * len(view)
view[0] = 0
L[0]