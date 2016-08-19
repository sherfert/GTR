require('openssl')
p = OpenSSL::PKey::RSA.new
p.public_encrypt('hi')