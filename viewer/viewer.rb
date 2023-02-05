require 'sinatra'
require 'net/http'
require 'json'
require 'aws-sdk'
require './lib/slack_import'
require './lib/slack'
require './lib/db'

$config = YAML.load_file('./config.yml')
$signer = nil

if $config.has_key? 'aws'
  Aws.config.update({
    credentials: Aws::Credentials.new(
      $config['aws']['access_key_id'],
      $config['aws']['secret_access_key'],
    ),
    region: 'ap-northeast-1',
  })
  $signer = Aws::S3::Presigner.new
end

configure do
  set :absolute_redirects, false
  set :prefixed_redirects, true
end

def sign_file(file)
  if file.has_key? 'url_private_download'
    url = $signer.presigned_url(:get_object, {
      bucket: 'tsgbot-slack-files',
      key: file['id'],
      expires_in: 180,
    })
    file['url_private_download'] = url
  end
end

def sign_message_files(messages)
  unless $signer.nil?
    messages.each do |message|
      if message.has_key? 'files'
        message['files'].each do |file|
          sign_file(file)
        end
      end

      # Compatibility with old messages
      if message.has_key? 'file'
        file = message['file']
        sign_file(file)
      end
    end
  end
end

def users
  hashed_users = {}
  Users.find.each do |u|
    hashed_users[u[:id]] = u
  end
  hashed_users
end

def channels
  hashed_channels = {}
  Channels.find.sort(name: 1).each do |c|
    hashed_channels[c[:id]] = c
  end
  hashed_channels
end

def ims
  hashed_users = users
  hashed_ims = {}
  Ims.find.each do |c|
    hashed_ims[c[:id]] = c
    hashed_ims[c[:id]][:name] = hashed_users[c[:user]][:name]
  end
  hashed_ims.sort_by {|k, v| v[:name] }.to_h
end

def emojis
  emojis = Emojis.find.map do |emoji|
    [emoji[:name], emoji[:url]]
  end
  emojis.to_h
end

def messages(params)
  limit = params[:limit] || 100
  ts_direction = params[:min_ts].nil? ? -1 : 1
  conditions = [
    { '$or' => [{ hidden: { '$ne' => true } }, { subtype: 'tombstone' }] },
  ]
  conditions << { ts: { '$gte' => params[:min_ts] } } unless params[:min_ts].nil?
  conditions << { ts: { '$lte' => params[:max_ts] } } unless params[:max_ts].nil?
  conditions << { channel: params[:channel] } unless params[:channel].nil?

  # search thread replies
  conditions << { thread_ts: params[:thread_ts] } unless params[:thread_ts].nil?

  all_messages = Messages
    .find({ '$and' => conditions })
    .sort(ts: ts_direction)
  has_more_message = all_messages.count({limit: limit+1}) > limit
  return_messages = all_messages.limit(limit).to_a
  return_messages = return_messages.reverse if ts_direction == -1

  sign_message_files(return_messages)
  normalize_messages(return_messages)

  return return_messages, has_more_message
end

def search(params)
  limit = params[:limit] || 100
  ts_direction = params[:min_ts].nil? ? 'desc' : 'asc'
  ts_range = {
    gte: params[:min_ts],
    lte: params[:max_ts],
  }

  uri = URI.parse('http://elasticsearch:9200/slack_logger.messages/_search')
  http = Net::HTTP.new(uri.host, uri.port)
  query = {
    query: {
      bool: {
        must: [
          {
            query_string: {
              query: params[:search],
              default_field: 'text',
              default_operator: 'AND'
            }
          },
          {
            range: {
              ts: ts_range
            }
          }
        ]
      }
    },
    size: limit,
    sort: [
      { ts: ts_direction }
    ],
    highlight: {
      fields: { text: {} }
    }
  }
  req = Net::HTTP::Post.new(uri.path)
  req.initialize_http_header({ 'Content-Type' => 'application/json' })
  req.body = query.to_json

  res = http.request(req)
  if res.is_a?(Net::HTTPSuccess)
    res_data = JSON.parse(res.body)
    all_messages = res_data['hits']['hits'].map do |entry|
      message = entry['_source']
      message['_id'] = { '$oid' => entry['_id'] }
      if entry.has_key? 'highlight'
        message['text'] = entry['highlight']['text'][0]
      end
      message
    end
    all_messages = all_messages.reverse if ts_direction == 'desc'
    sign_message_files(all_messages)
    normalize_messages(all_messages)
    # FIXME: The meaning of hits.total.value might change in ElasticSearch 8
    # https://www.elastic.co/guide/en/elasticsearch/reference/current/breaking-changes-7.0.html#hits-total-now-object-search-response
    return all_messages, res_data['hits']['total']['value'] > limit
  else
    return [], false
  end
end

get '/users.json' do
  content_type :json
  users.to_json
end

get '/channels.json' do
  content_type :json
  channels.to_json
end

get '/ims.json' do
  content_type :json
  ims.to_json
end

get '/emojis.json' do
  content_type :json
  emojis.to_json
end

post '/messages/:channel.json' do
  all_messages, has_more_message = messages(
    channel: params[:channel],
    max_ts: params[:max_ts],
    min_ts: params[:min_ts]
  )
  all_messages = all_messages.select { |m| m[:ts] != params[:max_ts] && m[:ts] != params[:min_ts] }

  content_type :json
  {
    messages: all_messages,
    has_more_message: has_more_message
  }.to_json
end

post '/around_messages/:channel.json' do
  past_messages, has_more_past_message = messages(
    channel: params[:channel],
    max_ts: params[:ts],
    limit: 50
  )
  future_messages, has_more_future_message = messages(
    channel: params[:channel],
    min_ts: params[:ts],
    limit: 50
  )
  all_messages = (past_messages + future_messages).uniq { |m| m[:ts] }

  content_type :json
  {
    messages: all_messages,
    has_more_past_message: has_more_past_message,
    has_more_future_message: has_more_future_message
  }.to_json
end

post '/thread_messages.json' do
  thread_messages, _ = messages(
    thread_ts: params[:thread_ts],
    limit: 10000
  )

  content_type :json
  {
    messages: thread_messages
  }.to_json
end

get '/team.json' do
  content_type :json
  # TODO: cache in redis or mongodb or in memory?
  client = Slack::Web::Client.new
  client.team_info['team'].to_json
end

post '/import_backup' do
  exported_file = '/tmp/slack_export.zip'
  FileUtils.move(params[:file][:tempfile], exported_file)
  # TODO: show progress when import
  SlackImport.new.import_from_file(exported_file)

  { result: 'success' }.to_json
end

get '/' do
  hashed_channels = channels
  default_channel, _ = hashed_channels.find do |id, channel|
    channel[:name] == $config['default_channel']
  end
  if default_channel.nil?
    default_channel, _ = hashed_channels.first
  end
  redirect("/#{default_channel || 'CHANNELS_NOT_FOUND'}")
end

get '/:channel' do
  erb :index
end
get '/:channel/:ts' do
  erb :index
end
get '/search/:search_word' do
  erb :index
end
get '/thread/:thread_ts' do
  erb :index
end

post '/search' do
  all_messages, has_more_message = search(
    search: params[:word],
    max_ts: params[:max_ts],
    min_ts: params[:min_ts]
  )
  all_messages = all_messages.select { |m| m['ts'] != params[:max_ts] && m['ts'] != params[:min_ts] }
  content_type :json
  {
    messages: all_messages,
    has_more_message: has_more_message,
  }.to_json
end
