require 'yaml'
require './lib/slack'
require './lib/db'

class SlackLogger
  attr_reader :client

  def initialize
    @client = Slack::Web::Client.new
  end

  def is_private_channel(channel_name)
    channel_name[0] == 'G'
  end

  def is_direct_message(channel_name)
    channel_name[0] == 'D'
  end

  alias :_insert_message :insert_message # FIXME!!!
  def insert_message(message)
    _insert_message(message)
  end

  def update_users
    users = client.users_list['members']
    replace_users(users)
  end

  def update_channels
    channels = client.conversations_list({type: 'public_channel'})['channels']
    replace_channels(channels)
  end

  def update_emojis
    emojis = client.emoji_list['emoji'] rescue nil
    replace_emojis(emojis)
  end

  # log history messages
  def fetch_history(target, channel)
    messages = client.send(
      target,
      channel: channel,
      count: 1000,
    )['messages'] rescue nil

    unless messages.nil?
      messages.each do |m|
        m['channel'] = channel
        insert_message(m)
      end
    end
  end

  def start(receiver)
    begin
      receiver_thread = Thread.new { receiver.start!(self) }

      update_emojis
      update_users
      update_channels

      Channels.find.each do |c|
        puts "loading messages from #{c[:name]}"
        if c[:is_channel]
          fetch_history(:conversations_history, c[:id])
        end
        sleep(1)
      end

      # realtime event is joined and dont exit current thread
      receiver_thread.join
    ensure
      receiver_thread.kill
    end
  end
end
