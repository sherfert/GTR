require 'parser/current'
Parser::Builders::Default.emit_lambda = true # opt-in to most recent AST format

ruby      = File.read("crash4.rb")

p Parser::CurrentRuby.parse(ruby)