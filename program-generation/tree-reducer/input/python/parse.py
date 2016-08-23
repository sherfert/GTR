from _ast import AST
from ast import parse, dump
import json
import sys


def ast2json(node):
    """Adapted from https://github.com/Psycojoker/ast2json/blob/master/ast2json.py"""
    assert isinstance(node, AST)
    to_return = {}
    to_return['ast_type'] = node.__class__.__name__
    for attr in dir(node):
        if attr.startswith("_"):
            continue
        to_return[attr] = get_value(getattr(node, attr))

    return to_return

def str2json(string):
    return ast2json(parse(string))

def get_value(attr_value):
    if attr_value is None:
        return attr_value
    if isinstance(attr_value, (int, basestring, float, long, complex, bool)):
        return attr_value
    if isinstance(attr_value, list):
        return [get_value(x) for x in attr_value]
    if isinstance(attr_value, AST):
        return ast2json(attr_value)
    else:
        raise Exception("unknow case for '%s' of type '%s'" % (attr_value, type(attr_value)))

content = sys.stdin.read()

tree = parse(content)

str = ast2json(tree)
js = json.dumps(str)
print(js)

