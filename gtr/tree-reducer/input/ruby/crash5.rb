require "openssl"
require "socket"

ctx = OpenSSL::SSL::SSLContext.new
ctx.ciphers = "aNULL"

sock1, sock2 = UNIXSocket.pair
ssl1 = OpenSSL::SSL::SSLSocket.new(sock1, ctx)
ssl2 = OpenSSL::SSL::SSLSocket.new(sock2, ctx)

t = Thread.new { ssl1.connect } # => segmentation fault
ssl2.accept

ssl1.close # calls #stop (private method)
sock1.close

t.value