require './lib/db'

total_messages = Messages.count

cnt = 0
Messages.find.each do |message|
  insert_message(message)
  cnt += 1
  if cnt % 1000 == 0
    puts "Migrated #{cnt}/#{total_messages} messages (ts = #{message['ts']})"
  end
end
puts "Migrated #{cnt} messages"
