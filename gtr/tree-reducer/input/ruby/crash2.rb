def x
  Proc.new { return 1 }.tap(&:call)
end
p x