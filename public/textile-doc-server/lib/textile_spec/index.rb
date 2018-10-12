module TextileSpec
  class Index < OpenStruct
    include YamlCache
    attr_reader :file
    
    def initialize(yaml_uri=nil)
      @file = yaml_uri || settings.remote_index_yaml_uri
      super(index_data)
    end
    
    def specs
      @specs ||= SpecAssociation.new(@table[:specs])
    end
    
    def expand_spec_path(filename)
      File.join(File.dirname(self.file), filename)
    end
    
    private
      def index_data
        load_yaml.tap do |index|
          index[:specs] = index[:specs].map do |title, metadata|
            metadata['title'] = title
            metadata['file'] = expand_spec_path(metadata['file'])
            metadata
          end
        end
      end
    
  end
end