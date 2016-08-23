import ast
import json
import sys
import astor

def as_ast(dct):
    """See https://docs.python.org/2/library/ast.html"""
    if dct['ast_type'] == "Module":
        return ast.Module(dct["body"])
    elif dct['ast_type'] == "Interactive":
        return ast.Interactive(dct["body"])
    elif dct['ast_type'] == "Expression":
        return ast.Expression(dct["body"])
    elif dct['ast_type'] == "Suite":
        return ast.Suite(dct["body"])
    elif dct['ast_type'] == "FunctionDef":
        return ast.FunctionDef(dct["name"], dct["args"], dct["body"], dct["decorator_list"])
    elif dct['ast_type'] == "ClassDef":
        return ast.ClassDef(dct["name"], dct["bases"], dct["body"], dct["decorator_list"])
    elif dct['ast_type'] == "Return":
        return ast.Return(dct["value"])
    elif dct['ast_type'] == "Delete":
        return ast.Delete(dct["targets"])
    elif dct['ast_type'] == "Assign":
        return ast.Assign(dct["targets"], dct["value"])
    elif dct['ast_type'] == "AugAssign":
        return ast.AugAssign(dct["target"], dct["op"], dct["value"])
    elif dct['ast_type'] == "Print":
        return ast.Print(dct["dest"], dct["values"], dct["nl"])
    elif dct['ast_type'] == "For":
        return ast.For(dct["target"], dct["iter"], dct["body"], dct["orelse"])
    elif dct['ast_type'] == "While":
        return ast.While(dct["test"], dct["body"], dct["orelse"])
    elif dct['ast_type'] == "If":
        return ast.If(dct["test"], dct["body"], dct["orelse"])
    elif dct['ast_type'] == "With":
        return ast.With(dct["context_expr"], dct["optional_vars"], dct["body"])
    elif dct['ast_type'] == "Raise":
        return ast.Raise(dct["type"], dct["inst"], dct["tback"])
    elif dct['ast_type'] == "TryExcept":
        return ast.TryExcept(dct["body"], dct["handlers"], dct["orelse"])
    elif dct['ast_type'] == "TryFinally":
        return ast.TryFinally(dct["body"], dct["finalbody"])
    elif dct['ast_type'] == "Assert":
        return ast.Assert(dct["test"], dct["msg"])
    elif dct['ast_type'] == "Import":
        return ast.Import(dct["names"])
    elif dct['ast_type'] == "ImportFrom":
        return ast.ImportFrom(dct["module"], dct["names"], dct["level"])
    elif dct['ast_type'] == "Exec":
        return ast.Exec(dct["body"], dct["globals"], dct["locals"])
    elif dct['ast_type'] == "Global":
        return ast.Global(dct["names"])
    elif dct['ast_type'] == "Expr":
        return ast.Expr(dct["value"])
    elif dct['ast_type'] ==  "Pass":
        return ast.Pass()
    elif dct['ast_type'] ==  "Break":
        return ast.Break()
    elif dct['ast_type'] ==  "Continue":
        return ast.Continue()
    elif dct['ast_type'] == "BoolOp":
        return ast.BoolOp(dct["op"], dct["values"])
    elif dct['ast_type'] == "BinOp":
        return ast.BinOp(dct["left"], dct["op"], dct["right"])
    elif dct['ast_type'] == "UnaryOp":
        return ast.UnaryOp(dct["op"], dct["operand"])
    elif dct['ast_type'] == "Lambda":
        return ast.Lambda(dct["args"], dct["body"])
    elif dct['ast_type'] == "IfExp":
        return ast.IfExp(dct["test"], dct["body"], dct["orelse"])
    elif dct['ast_type'] == "Dict":
        return ast.Dict(dct["keys"], dct["values"])
    elif dct['ast_type'] == "Set":
        return ast.Set(dct["elts"])
    elif dct['ast_type'] == "ListComp":
        return ast.ListComp(dct["elt"], dct["generators"])
    elif dct['ast_type'] == "SetComp":
        return ast.SetComp(dct["elt"], dct["generators"])
    elif dct['ast_type'] == "DictComp":
        return ast.DictComp(dct["key"], dct["value"], dct["generators"])
    elif dct['ast_type'] == "GeneratorExp":
        return ast.GeneratorExp(dct["elt"], dct["generators"])
    elif dct['ast_type'] == "Yield":
        return ast.Yield(dct["value"])
    elif dct['ast_type'] == "Compare":
        return ast.Compare(dct["left"], dct["ops"], dct["comparators"])
    elif dct['ast_type'] == "Call":
        return ast.Call(dct["func"], dct["args"], dct["keywords"], dct["starargs"], dct["kwargs"])
    elif dct['ast_type'] == "Repr":
        return ast.Repr(dct["value"])
    elif dct['ast_type'] == "Num":
        return ast.Num(dct["n"])
    elif dct['ast_type'] == "Str":
        return ast.Str(dct["s"])
    elif dct['ast_type'] == "Attribute":
        return ast.Attribute(dct["value"], dct["attr"], dct["ctx"])
    elif dct['ast_type'] == "Subscript":
        return ast.Subscript(dct["value"], dct["slice"], dct["ctx"])
    elif dct['ast_type'] == "Name":
        return ast.Name(dct["id"], dct["ctx"])
    elif dct['ast_type'] == "List":
        return ast.List(dct["elts"], dct["ctx"])
    elif dct['ast_type'] == "Tuple":
        return ast.Tuple(dct["elts"], dct["ctx"])
    elif dct['ast_type'] ==  "Load":
        return ast.Load()
    elif dct['ast_type'] ==  "Store":
        return ast.Store()
    elif dct['ast_type'] ==  "Del":
        return ast.Del()
    elif dct['ast_type'] ==  "AugLoad":
        return ast.AugLoad()
    elif dct['ast_type'] ==  "AugStore":
        return ast.AugStore()
    elif dct['ast_type'] ==  "Param":
        return ast.Param()
    elif dct['ast_type'] ==  "Ellipsis":
        return ast.Ellipsis()
    elif dct['ast_type'] ==  "Slice":
        return ast.Slice(dct["lower"], dct["upper"], dct["step"])
    elif dct['ast_type'] ==  "ExtSlice":
        return ast.ExtSlice(dct["dims"])
    elif dct['ast_type'] ==  "Index":
        return ast.Index(dct["value"])
    elif dct['ast_type'] ==  "And":
        return ast.And()
    elif dct['ast_type'] ==  "Or":
        return ast.Or()
    elif dct['ast_type'] ==  "Add":
        return ast.Add()
    elif dct['ast_type'] ==  "Sub":
        return ast.Sub()
    elif dct['ast_type'] ==  "Mult":
        return ast.Mult()
    elif dct['ast_type'] ==  "Div":
        return ast.Div()
    elif dct['ast_type'] ==  "Mod":
        return ast.Mod()
    elif dct['ast_type'] ==  "Pow":
        return ast.Pow()
    elif dct['ast_type'] ==  "LShift":
        return ast.LShift()
    elif dct['ast_type'] ==  "RShift":
        return ast.RShift()
    elif dct['ast_type'] ==  "BitOr":
        return ast.BitOr()
    elif dct['ast_type'] ==  "BitXor":
        return ast.BitXor()
    elif dct['ast_type'] ==  "BitAnd":
        return ast.BitAnd()
    elif dct['ast_type'] ==  "FloorDiv":
        return ast.FloorDiv()
    elif dct['ast_type'] ==  "Invert":
        return ast.Invert()
    elif dct['ast_type'] ==  "Not":
        return ast.Not()
    elif dct['ast_type'] ==  "UAdd":
        return ast.UAdd()
    elif dct['ast_type'] ==  "USub":
        return ast.USub()
    elif dct['ast_type'] ==  "Eq":
        return ast.Eq()
    elif dct['ast_type'] ==  "NotEq":
        return ast.NotEq()
    elif dct['ast_type'] ==  "Lt":
        return ast.Lt()
    elif dct['ast_type'] ==  "LtE":
        return ast.LtE()
    elif dct['ast_type'] ==  "Gt":
        return ast.Gt()
    elif dct['ast_type'] ==  "GtE":
        return ast.GtE()
    elif dct['ast_type'] ==  "Is":
        return ast.Is()
    elif dct['ast_type'] ==  "IsNot":
        return ast.IsNot()
    elif dct['ast_type'] ==  "In":
        return ast.In()
    elif dct['ast_type'] ==  "NotIn":
        return ast.NotIn()
    elif dct['ast_type'] ==  "comprehension":
        return ast.comprehension(dct["target"], dct["iter"], dct["ifs"])
    elif dct['ast_type'] ==  "ExceptHandler":
        return ast.ExceptHandler(dct["type"], dct["name"], dct["body"])
    elif dct['ast_type'] ==  "arguments":
        return ast.arguments(dct["args"], dct["vararg"], dct["kwarg"], dct["defaults"])
    elif dct['ast_type'] ==  "keyword":
        return ast.keyword(dct["arg"], dct["value"])
    elif dct['ast_type'] ==  "alias":
        return ast.alias(dct["name"], dct["asname"])
    else:
        return dct

with open(sys.argv[1], 'r') as content_file:
    content = content_file.read()

tree = json.loads(content, object_hook=as_ast)
print astor.to_source(tree)