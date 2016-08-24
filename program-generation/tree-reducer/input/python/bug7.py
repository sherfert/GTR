import ast

class X(ast.FunctionDef):
  def __init__(self):
    m = ast.parse("def f(): pass")
    self.fun_def = m.body[0]

  def __getattr__(self, attr):
    global m

    print("__getattr__:", attr)

    if attr in ["col_offset", "lineno"]:
      m.body[1:] = []
      return 1
    
    x = getattr(self.fun_def, attr)
    return x

m = ast.Module(body=[X() for i in range(1337)])
compile(m, "<string>", "exec")