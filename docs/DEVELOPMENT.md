# Manual Setup for Development

## 1. Start Devcontainer

You can use devcontainer for development.

```sh
$ export SLACK_PATRON_SLACK_TOKEN=[YOUR TOKEN HERE]
$ devcontainer up --workspace-folder .devcontainer .
```

## 2. Setup

```sh
$ docker compose exec viewer bash # operate inside viewer container
$ cd workspace
$ bundle install
$ ./viewer/setup.sh
```

## 3. Start Slack Message Logger

```sh
$ bundle exec ruby ./logger/logger.rb &
```

## 4. Start Slack Message Viewer

```sh
$ bundle exec rackup ./viewer/config.ru -o 0.0.0.0
```

Visit http://localhost:9292
