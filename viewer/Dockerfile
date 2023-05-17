FROM ruby:2.7.2-alpine
LABEL maintainer="TSG <info@tsg.ne.jp>"

ARG SRCDIR="/usr/local/slack-patron"

RUN set -x && \
	apk upgrade --update && \
	apk add --update \
	build-base \
	openssl \
	nodejs \
	nodejs-npm && \
	echo 'gem: --no-document' >> /etc/gemrc

WORKDIR ${SRCDIR}

COPY Gemfile ${SRCDIR}/
COPY Gemfile.lock ${SRCDIR}/
RUN bundle install

COPY viewer/package.json ${SRCDIR}/viewer/
COPY viewer/package-lock.json ${SRCDIR}/viewer/
RUN cd ${SRCDIR}/viewer && npm install

CMD ./viewer/setup.sh && bundle exec puma viewer/config.ru -C viewer/puma.rb -p 9292

EXPOSE 9292
