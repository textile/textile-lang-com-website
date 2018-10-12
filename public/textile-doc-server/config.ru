begin
  require 'psych'
  YAML::ENGINE.yamler = 'psych'
rescue LoadError
end

require 'rubygems'
require 'bundler'

Bundler.require

require './app'
run Sinatra::Application