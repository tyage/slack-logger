# Import Slack backup file

There are two ways to import Slack's backup file.

## With GUI (in viewer)

Import dialog will appear when you click team name in viewer.

## With Command Line

Import Slack backup file with GUI might be difficult because of its file size.

You can also import the file with `./bin/import.rb`.

```sh
$ docker compose cp PATH_TO_BACKUP_FILE logger:/tmp/slack_backup.zip
$ docker compose exec logger bash -c "bundle exec ruby ./bin/import.rb /tmp/slack_backup.zip"
```
