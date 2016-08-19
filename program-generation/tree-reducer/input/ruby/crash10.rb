class Foo
  def self.seg_fault(a = {}, b: 0); end
end

Foo.seg_fault('x' => 'y')