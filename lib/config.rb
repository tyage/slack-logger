require 'yaml'

module SlackPatronConfig
  CONFIG_FROM_FILE = begin
    YAML.load_file('./config.yml') 
  rescue
    nil
  end

  def self.config

    {
      slack: {
        token:  value('slack', 'token'),
        team_id: value('slack', 'team_id'),
        use_events_api: value('slack', 'use_events_api'),
        signing_secret: value('slack', 'signing_secret'),
      },
      aws: {
        access_key_id: value('aws', 'access_key_id'),
        secret_access_key: value('aws', 'secret_access_key')
      },
      default_channel: value('default_channel') || 'general',
      database: {
        uri: value('database', 'uri') || 'mongo:27017',
        database: value('database', 'database') || 'slack_logger'
      }
    }
  end

  def self.value(*args)
    config_from_file = CONFIG_FROM_FILE&.dig(*args)

    # config from env should be like $SLACK_PATRON_...
    env_prefix = 'SLACK_PATRON_'
    env_suffix = args.map(&:upcase).join('_')
    config_from_env = ENV[env_prefix + env_suffix]

    config_from_file || config_from_env
  end
end
