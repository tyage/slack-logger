import React from 'react';
import { connect } from 'react-redux'
import { EmojiData } from 'emoji-data-ts';

import "./MrkdwnText.less";

const emojiData = new EmojiData();
const emojiRegex = new RegExp(':([\\p{Letter}\\p{Number}+\\-_\']+):', 'giu');

class MrkdwnText extends React.Component {
  static defaultProps = {
    onLoadMoreMessages: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoadingMore: false,
      isLoadingPast: false
    };
  }
  getChannel(id) {
    const channels = this.props.channels;
    const ims = this.props.ims;
    if (channels && channels[id]) {
      return channels[id];
    }
    if (ims && ims[id]) {
      return ims[id];
    }
  }
  getUser(id) {
    const users = this.props.users;
    return users && users[id];
  }
  getEmojiImage(name) {
    const data = emojiData.getImageData(name);
    if (data) {
      return `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@v4.1.0/img-apple-64/${data.imageUrl}`
    }
    const emojis = this.props.emojis;
    const emoji = emojis && emojis[name];
    if (emoji && emoji.startsWith('alias:')) {
      return this.getEmojiImage(emoji.split(':')[1]);
    }
    return emoji;
  }
  formatText(text) {
    const entity = (str) => {
      return str.replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };
    const channelLink = (id) => {
      const channel = this.getChannel(id);
      return `#${channel && channel.name}`;
    };
    const userLink = (id) => {
      const user = this.getUser(id);
      return `@${user && (user.profile.display_name || user.profile.real_name || user.name)}`;
    };
    const specialCommand = (command) => `@${command}`;
    const uriLink = (uri, text) => `<a href="${uri}" target="_blank">${text}</a>`;
    const emojiImage = (name) => {
      const image = this.getEmojiImage(name);
      if (image) {
        return `<img class="emoji" src="${image}">`;
      }
      return `:${name}:`;
    };
    if (text) {
      return text
        .replace(/<#([0-9A-Za-z]+)>/, (m, id) => channelLink(id))
        .replace(/<#([0-9A-Za-z]+)\|([0-9A-Za-z]+)>/gi, (m, id) => channelLink(id))
        .replace(/<@([0-9A-Za-z]+)>/gi, (m, id) => userLink(id))
        .replace(/<@([0-9A-Za-z]+)\|([0-9A-Za-z]+)>/gi, (m, id) => userLink(id))
        .replace(/<!(channel|everyone|group)>/gi, (m, command) => specialCommand(command))
        .replace(/<(https?:\/\/[^>|]*)\|(.+?)>/gi, (m, uri, text) => uriLink(entity(uri), entity(text)))
        .replace(/<(https?:\/\/[^>|]*)>/gi, (m, uri) => uriLink(entity(uri), entity(uri)))
        .replace(emojiRegex, (m, name) => emojiImage(name))
        .replace(/[*＊](.+?)[*＊]/gi, (m, text) => `<strong>${text}</strong>`);
    }
    return text;
  }
  render() {
    return (
      <span className="mrkdwn-text" dangerouslySetInnerHTML={{__html: this.formatText(this.props.text) || ''}}></span>
    );
  }
}

const mapStateToProps = state => {
  return {
    users: state.users,
    channels: state.channels.channels,
    ims: state.channels.ims,
    emojis: state.emojis,
  };
};

export default connect(mapStateToProps)(MrkdwnText);
