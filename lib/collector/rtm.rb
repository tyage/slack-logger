module Collector
  class RTM
    def start!(logger)
      loop do
        realtime = Slack::RealTime::Client.new

        realtime.on :message do |m|
          puts 'new message'
          logger.new_message(m)
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

        realtime.on :reaction_added do |c|
          puts "reaction has added"
          logger.new_reaction(c['item']['ts'], c['reaction'], c['user'])
        end

        realtime.on :reaction_removed do |c|
          puts "reaction has removed"
          logger.drop_reaction(c['item']['ts'], c['reaction'], c['user'])
        end

        # if connection closed, restart the realtime logger
        realtime.on :close do
          puts "websocket disconnected"
        end

        realtime.start!
        sleep 3 # なんかの理由で無限ループしても大丈夫なようにおきもち
      end
    end
  end
end
