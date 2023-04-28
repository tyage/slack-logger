require './lib/slack'

require './lib/slack_logger'
require './lib/collector/events_api'
require './lib/collector/rtm'

config = YAML.load_file('./config.yml')

collector = config['slack']['use_events_api'] ? SlackPatron::Collector::EventsAPI.new(config['slack']['team_id']) : SlackPatron::Collector::RTM.new
SlackLogger.new.start collector
