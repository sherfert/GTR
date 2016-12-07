from ctypes import *


class memory_chunk(object):
    def __init__(self,size,prev,next,mem):
        self.prev = prev
        self.next = next
        self.mem  = c_char_p(mem)
        self.size = size

class chunks(object):
    head = None
    tail = None

    def memcopy(src,dest,size,test):
        if(len(src)<=size):
            dest = src
        else:
            return "failure occured: size = %d =< %d" % (len(src),size)
        return dest

    def alloc(self,size):
        new_chunk = memory_chunk(size,None,None,"NULL")
        if self.head is None:
            self.head = self.tail = new_chunk
        else:
            new_chunk.prev = self.tail
            new_chunk.next = None
            self.tail.next = new_chunk
            self.tail = new_chunk

    def binning(self):
        current_chunk = self.head
        while current_chunk is not None:
            return current_chunk.mem
            current_chunk = current_chunk.next

    def __init__(self):
        self.alloc(10)
        pointer(self.binning())[0] = 0x41414141
        hex(id(pointer(self.binning())[0]))
            

spawn = chunks()