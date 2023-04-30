require 'slack-ruby-client'
require './lib/config'

config = SlackPatronConfig.config

Slack.configure do |c|
  c.token = config[:slack][:token]
end

Slack::RealTime::Client.configure do |c|
  c.start_method = :rtm_connect
  c.store_class = Slack::RealTime::Stores::Starter
end

Slack::Events.configure do |c|
  c.signing_secret = config[:slack][:use_events_api] ? config[:slack][:signing_secret] : nil
end

module SlackPatron
  class SlackClient
    attr_reader :client

    def initialize
      @client = Slack::Web::Client.new
    end

    def conversations_list
      channels = []
      client.conversations_list({type: 'public_channel', limit: 1000}) do |response|
        channels += response.channels
      end
      channels
    end

    def users_list
      members = []
      client.users_list do |response|
        members += response.members
      end
      members
    end

    def emoji_list
      # paginationがないらしい
      client.emoji_list.emoji
    end

    def conversations_history(channel, count)
      client.conversations_history({channel: channel, limit: count}).messages
    end
  end
end
