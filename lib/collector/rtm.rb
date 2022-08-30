module Collector
  class RTM
    def start!(logger)
      realtime = Slack::RealTime::Client.new

      realtime.on :message do |m|
        if logger.is_private_channel(m['channel'])
          next
        end
        if logger.is_direct_message(m['channel'])
          next
        end

        puts 'new message'
        logger.insert_message(m)
      end

      realtime.on :team_join do |e|
        puts "new user has joined"
        logger.update_users
      end

      realtime.on :user_change do |e|
        puts "user data has changed"
        logger.update_users
      end

      realtime.on :channel_created do |c|
        puts "channel has created"
        logger.update_channels
      end

      realtime.on :channel_rename do |c|
        puts "channel has renamed"
        logger.update_channels
      end

      realtime.on :emoji_changed do |c|
        puts "emoji has changed"
        logger.update_emojis
      end

      # if connection closed, restart the realtime logger
      realtime.on :close do
        puts "websocket disconnected"
        start! logger
      end

      realtime.start!
    end
  end
end
