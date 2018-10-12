set :root, File.dirname(__FILE__)
$LOAD_PATH.unshift(File.dirname(__FILE__) + '/lib')
require 'textile_spec'

set :remote_index_yaml_uri, "#{settings.root}/../textile-spec/index.yaml"

configure :production, :test do
  require 'dalli'
  set :cache, Dalli::Client.new('localhost:11211', :compression => true)
  set :remote_index_yaml_uri, "https://github.com/textile/textile-spec/raw/master/index.yaml"
end

layout 'layout'
set :haml, :format => :html5

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end

### Public

get '/' do
  @index = TextileSpec::Index.new
  @documents = @index.specs
  haml :index
end

get '/stylesheets/:filename.css' do
  scss :"stylesheets/#{params[:filename]}"
end

post '/specs/flush/?' do
  settings.cache.flush
  halt "Cache flushed."
end

get '/:slug/?' do
  @spec = TextileSpec.find(params[:slug])
  halt(404, "Page not found") unless @spec
  haml :document
end