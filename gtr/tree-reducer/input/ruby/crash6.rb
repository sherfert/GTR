GC.start

def a
  lambda do
    yield
  end
end

def b(&block)
  a(&block)
end

def proc_sources
  sources = []
  ObjectSpace.each_object(Proc) do |proc|
    sources << proc.source_location.join(":")
  end
  sources
end

c = b {p 1}

old_proc_sources = proc_sources
GC.start
new_proc_sources = proc_sources
p(old_proc_sources - new_proc_sources)

c.call