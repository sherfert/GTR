import ast
m = ast.Module(body=[
    ast.Expr(value=ast.Name(id='foo', ctx=ast.Store()))
])
ast.fix_missing_locations(m)
code = compile(m, '', mode='exec')
eval(code)