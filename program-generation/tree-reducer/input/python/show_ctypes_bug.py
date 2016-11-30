#!/usr/bin/python

import ctypes
import os

class MessageQueueAttributes(ctypes.Structure):
    _fields_ = [("mq_flags", ctypes.c_long),
                ("mq_maxmsg", ctypes.c_long),
                ("mq_msgsize", ctypes.c_long),
                ("mq_curmsgs", ctypes.c_long)]

print "Starting example"
librt = ctypes.CDLL("librt.so", use_errno=True)
print "Creating queue"
queue = librt.mq_open(ctypes.c_char_p("/show_bug"),
                      ctypes.c_int(os.O_CREAT | os.O_RDWR),
                      ctypes.c_int(0o644),
                      ctypes.byref(MessageQueueAttributes(0, 1, 1, 0)))

print "Loading attributes"
attributes = MessageQueueAttributes()
assert attributes.mq_maxmsg == 0
assert attributes.mq_msgsize == 0
# Comment out the below line and the crash goes away.
librt.mq_getattr(queue, ctypes.byref(attributes))
assert attributes.mq_maxmsg == 1
assert attributes.mq_msgsize == 1

print "Cleaning up"
librt.mq_close(queue)
librt.mq_unlink(ctypes.c_char_p("/show_bug"))
print "Completed example"
