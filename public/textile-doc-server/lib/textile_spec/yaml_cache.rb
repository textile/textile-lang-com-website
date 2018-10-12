module TextileSpec
  module YamlCache
    def load_yaml
      unless settings.respond_to?(:cache) && file_contents = settings.cache.get(file)
        file_contents = open(file) { |f| f.read }
        raise "Spec yaml file missing or empty." if file_contents.nil? || file_contents == ''
        settings.cache.set(file, file_contents) if settings.respond_to?(:cache)
      end
      YAML::load(file_contents)
    end

  end
end