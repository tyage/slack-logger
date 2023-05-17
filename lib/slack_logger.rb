require './lib/slack'
require './lib/db'

class SlackLogger
  attr_reader :slack

  def initialize
    @slack = SlackPatron::SlackClient.new
  end

  def is_private_channel(channel_name)
    channel_name[0] == 'G'
  end

  def is_direct_message(channel_name)
    channel_name[0] == 'D'
  end

  def is_tombstone(message)
    message['subtype'] == 'tombstone'
  end

  def skip_message?(message)
    channel = message['channel']
    is_private_channel(channel) || is_direct_message(channel) || is_tombstone(message)
  end

  def new_message(message)
    return if skip_message?(message)
    if message['subtype'] == 'message_changed'
      new_message({
        **message['message'],
        'channel' => message['channel'],
      })
    else
      insert_message(message)
    end
  end

  def new_reaction(ts, name, user)
    add_reaction(ts, name, user)
  end

  def drop_reaction(ts, name, user)
    remove_reaction(ts, name, user)
  end

  def update_users
    users = slack.users_list
    replace_users(users)
  end

  def update_channels
    channels = slack.conversations_list
    replace_channels(channels)
  end

  def update_emojis
    emojis = slack.emoji_list
    replace_emojis(emojis)
  end

  def fetch_history(channel)
    begin
      messages = slack.conversations_history(channel, 1000)
    rescue Slack::Web::Api::Errors::NotInChannel, Slack::Web::Api::Errors::ChannelNotFound
      return # どうしようもないね
    end
    return if messages.nil?

    messages.each do |m|
      m['channel'] = channel
      insert_message(m)
    end
  end

  def start(collector)
    begin
      collector_thread = Thread.new { collector.start!(self) }

      update_emojis
      update_users
      update_channels

      Channels.find.each do |channel|
        puts "loading messages from #{channel[:name]}"
        fetch_history channel[:id]
        sleep 1
      end

      # realtime event is joined and dont exit current thread
      collector_thread.join
    ensure
      collector_thread.kill
    end
  end
end
