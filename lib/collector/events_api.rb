require 'rack'

module Collector
  class EventsAPI
    attr_reader :logger

    def initialize(team_id)
      @team_id = team_id
      raise ArgumentError unless @team_id and @team_id.start_with? 'T'
    end

    def start!(logger)
      @logger = logger

      Rack::Server.start(
        app: lambda do |env|
          req = Rack::Request.new(env)

          begin
            Slack::Events::Request.new(req).verify!
            process(req.body)
          rescue Slack::Events::Request::MissingSigningSecret,
                 Slack::Events::Request::InvalidSignature,
                 Slack::Events::Request::TimestampExpired => e
            warn 'bad request: %s' % e
            [400, {}, '']
          end
        end,
        Port: 9293,
      )
    end

    def process(body)
      # https://api.slack.com/apis/connections/events-api

      data = JSON.parse(body.read)
      type = data['type']

      case type
      when 'url_verification'
        [200, { 'content-type': 'text/plain' }, data['challenge']]
      when 'event_callback'
        process_event data['event'] if data['team_id'] == @team_id
        [204, {}, '']
      else
        [400, {}, '']
      end
    end

    def process_event(event)
      type = event['type']
      event.delete 'type'

      case type
      when 'message'
        # https://api.slack.com/events/message
        puts 'new message'
        logger.new_message(event)

      when 'team_join'
        puts 'new user has joined'
        logger.update_users

      when 'user_change'
        puts 'user data has changed'
        logger.update_users

      when 'channel_created'
        puts 'channel has created'
        logger.update_channels

      when 'channel_rename'
        puts 'channel has renamed'
        logger.update_channels

      when 'emoji_changed'
        puts 'emoji has changed'
        logger.update_emojis
      end

      when 'reaction_added'
        puts "reaction has added"
        logger.new_reaction(event['item']['ts'], event['reaction'], event['user'])
      end

      when 'reaction_removed'
        puts "reaction has removed"
        logger.drop_reaction(event['item']['ts'], event['reaction'], event['user'])
      end
    end
  end
end
