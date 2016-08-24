#! /usr/bin/python

import argparse


with open('simple','w') as argfile:
    argfile.write('-egg\nspam\n')

parser = argparse.ArgumentParser(fromfile_prefix_chars='@')
parser.add_argument('-egg')
ns = parser.parse_args(['@simple'])

print ns


with open('empty_string_value','w') as argfile:
    argfile.write('-zyxxy\n\n-xyzzy\n\n-magic\nword\n')

parser = argparse.ArgumentParser(fromfile_prefix_chars='@')
parser.add_argument('-zyxxy')
parser.add_argument('-xyzzy')
parser.add_argument('-magic')

ns = parser.parse_args(['@empty_string_value'])

print ns

with open('ends_with_blank_line','w') as argfile:
    argfile.write('-foo\nbar\n-baz\nquux\n\n')

parser = argparse.ArgumentParser(fromfile_prefix_chars='@')
parser.add_argument('-foo')
parser.add_argument('-baz')

ns = parser.parse_args(['@ends_with_blank_line'])

print ns

