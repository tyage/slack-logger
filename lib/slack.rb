require 'yaml'
require 'slack-ruby-client'

config = YAML.load_file('./config.yml')

Slack.configure do |c|
  c.token = config['slack']['token']
end

Slack::RealTime::Client.configure do |c|
  c.start_method = :rtm_connect
  c.store_class = Slack::RealTime::Stores::Starter
end

Slack::Events.configure do |c|
  c.signing_secret = config['slack']['use_events_api'] ? config['slack']['signing_secret'] : nil
end
