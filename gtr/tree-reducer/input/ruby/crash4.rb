class YamlStreamCreator

  def initialize(encoding)
    # we don't include space, tab, etc in this list of characters
    character_list = (0x40..0x7e).to_a + (0xa0..0x2ffff).to_a
    @string = character_list.inject('') do |s, c|
      begin
        s << c
      rescue RangeError
        # skip any range errors
      end
      s
    end
    @string.encode!(encoding, 'utf-8', invalid: :replace, undef: :replace, replace: '')
  end

  def size
    @string.length
  end

  def string(len=11)
    len = size if len > size
    str = @string[0...len]
    @string = @string[len..-1]
    str
  end

  def characters_available?
    @string.length >= 1
  end

  def stream(output_encoding)
    count = 1
    stream = "---\n".encode(output_encoding)
    stream += "  customer: thing\n".encode(output_encoding)
    while characters_available? and stream.size < kb_to_bytes(45)
      stream += "  variable: ".encode(output_encoding)
      stream += string.encode(output_encoding)
      stream += "\n".encode(output_encoding)
      count += 1
    end
    stream
  end

  def kb_to_bytes(kb)
    kb * 1024
  end
end

encoding = "UTF-16"
yaml_creator = YamlStreamCreator.new(encoding)
stream = yaml_creator.stream(encoding)