class Foo
  def self.respond_to?(*args)
    super
  end
end

{ foo: Foo }.dig(:foo, :foo)