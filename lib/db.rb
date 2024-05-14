require 'mongo'
require './lib/config'

config = SlackPatronConfig.config

db_config = config[:database]
db = Mongo::Client.new([ db_config[:uri] ], database: db_config[:database])

def denormalize_message(message)
  # denormalize reactions
  if message.has_key? 'reactions'
    message['reactions'] = message['reactions'].flat_map do |reaction|
      if reaction.has_key? 'user'
        [{
          'name' => reaction['name'],
          'user' => reaction['user'],
        }]
      elsif reaction.has_key? 'users'
        reaction['users'].map do |user|
          {
            'name' => reaction['name'],
            'user' => user,
          }
        end
      else
        []
      end
    end
  end
  message
end

def normalize_message(message)
  # normalize reactions
  if message.has_key? 'reactions'
    reactions = Hash.new do |h, k|
      h[k] = {
        'count' => 0,
        'name' => k,
        'users' => [],
      }
    end
    message['reactions'].map do |reaction|
      if reaction.nil?
        next
      end
      if reaction.has_key? 'user'
        reactions[reaction['name']]['users'] << reaction['user']
        reactions[reaction['name']]['count'] += 1
      end
      if reaction.has_key? 'users'
        reactions[reaction['name']]['users'].push(*reaction['users'])
        reactions[reaction['name']]['count'] += reaction['count']
      end
    end
    message['reactions'] = reactions.values
  end
  message
end

def normalize_messages(messages)
  messages.each do |message|
    normalize_message(message)
  end
end

Users = db['users']
Users.indexes.create_one({ :id => 1 }, :unique => true)
def replace_users(users)
  unless users.nil?
    ids = users.map{ |user| user['id'] }
    Users.find(id: { '$in' => ids }).delete_many
    Users.insert_many(users)
  end
end

Channels = db['channels']
Channels.indexes.create_one({ :id => 1 }, :unique => true)
def replace_channels(channels)
  return if channels.nil?
  ids = channels.map{ |channel| channel['id'] }
  Channels.find(id: { '$in' => ids }).delete_many
  Channels.insert_many(channels)
end

# Ims
#   for backward compatibility. should be removed.
Ims = db['ims']
Ims.indexes.create_one({ :id => 1 }, :unique => true)

Emojis = db['emojis']
Emojis.indexes.create_one({ :name => 1 }, :unique => true)
def replace_emojis(emojis)
  return if emojis.nil?
  emoji_data = emojis.map{ |name, url| { 'name' => name, 'url' => url } }
  Emojis.find(name: { '$in' => emojis.keys }).delete_many
  Emojis.insert_many(emoji_data)
end

Messages = db['messages']
Messages.indexes.create_one({ :ts => 1 }, :unique => true)
Messages.indexes.create_one({ :thread_ts => 1 })
def insert_message(message)
  # Message can be duplicate but dont check (to improve the speed)
  begin
    subtype = message[:subtype] || message['subtype']
    if subtype == 'message_replied'
      message_inside = message[:message] || message['message']
      unless message_inside.nil?
        message_inside['channel'] = message['channel']
        insert_message(message_inside)
      end
    else
      denormalize_message(message)

      files = message[:files] || message['files']
      if !files.nil? && files.is_a?(Array)
        if files.any? { |file| file['mode'] == 'hidden_by_limit' }
          message.delete(:files) || message.delete('files')
        end
      end

      index = { :ts => message[:ts] || message['ts'] }
      Messages.update_one(index, { :$set => message }, { :upsert => true })
    end
  rescue
  end
end

def add_reaction(ts, name, user)
  Messages.update_one(
    { :ts => ts },
    {
      :$addToSet => {
        :reactions => {
          :name => name,
          :user => user,
        },
      },
    },
  )
end

def remove_reaction(ts, name, user)
  Messages.update_one(
    { :ts => ts },
    {
      :$pull => {
        :reactions => {
          :$in => [{
            :name => name,
            :user => user,
          }],
        },
      },
    },
  )
end
