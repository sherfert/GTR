import io
class R(io.RawIOBase):
    def writable(self): return True
    def write(self, b):
        print("About to evaluate {!r}.format".format(b))
        b.format
        print("Never reached")
                           
b = io.BufferedWriter(R())
b.write(b"x")
b.flush()