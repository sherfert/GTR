import ast

with open('./test.py', u'r') as content_file:
    content = content_file.read()

tree = ast.parse(content)

def printinfo( name, age ):
   """"This prints a passed info into this function"""
   print "Name: ", name
   print "Age ", age
   return
 
printinfo("satia", 5.6)