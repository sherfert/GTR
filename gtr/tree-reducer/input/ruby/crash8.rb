class Yielder
  def each
    yield [1,2]
  end
end

class Getter1
  include Enumerable

  def each(&block)
    Yielder.new.each(&block)
  end
end

class Getter2
  include Enumerable

  def each
    Yielder.new.each { |a,b| yield(a) }
  end
end

Getter1.new.map { Getter2.new.map {} }