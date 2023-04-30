import React from 'react';
import { connect } from 'react-redux'
import SlackMessage from './SlackMessage';

class MessagesList extends React.Component {
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
  scrollToLastMessage() {
    this.refs.messagesList.scrollTop = this.currentHeight();
  }
  currentHeight() {
    return this.refs.messagesList.scrollHeight;
  }
  handleLoadMore(isPast) {
    if (this.state.isLoadingMore) {
      return;
    }

    this.setState({
      isLoadingMore: true,
      isLoadingPast: isPast
    });
    this.previousHeight = this.currentHeight();
    this.previousTop = this.refs.messagesList.scrollTop;

    const oldestTs = (this.props.messages.length > 0) && this.props.messages[0].ts;
    const latestTs = (this.props.messages.length > 0) && this.props.messages[this.props.messages.length - 1].ts;
    this.props.onLoadMoreMessages({
      isPast,
      limitTs: isPast ? oldestTs : latestTs
    });
  }
  componentDidMount() {
    this.scrollToLastMessage();
  }
  componentDidUpdate() {
    if (this.scrollBackAfterUpdate) {
      // fix scrollTop when load more messages
      if (this.state.isLoadingPast) {
        this.refs.messagesList.scrollTop = this.currentHeight() - (this.previousHeight || 0);
      } else {
        this.refs.messagesList.scrollTop = this.previousTop || 0;
      }
      this.scrollBackAfterUpdate = false;
    }
    if (this.scrollToLastMessageAfterUpdate) {
      this.scrollToLastMessage();
      this.scrollToLastMessageAfterUpdate = false;
    }
    if (this.scrollToTsAfterUpdate) {
      const node = this.tsToNode[this.props.scrollToTs];
      if (node) {
        this.refs.messagesList.scrollTop = node.getBoundingClientRect().top - this.refs.messagesList.getBoundingClientRect().height / 2
      }
      this.scrollToTsAfterUpdate = false;
    }
  }
  componentWillReceiveProps(nextProps) {
    // TODO: create reducer which manage scroll state
    // loading more
    if (this.state.isLoadingMore && nextProps.messages !== this.props.messages) {
      this.scrollBackAfterUpdate = true;
      this.setState({ isLoadingMore: false });
    }

    // first view
    if (nextProps.messagesInfo !== this.props.messagesInfo || nextProps.scrollToTs !== this.props.scrollToTs) {
      if (this.props.scrollToTs) {
        this.scrollToTsAfterUpdate = true;
      } else {
        this.scrollToLastMessageAfterUpdate = true;
      }
    }
  }
  showMessage(message) {
    const hideBotMessages = this.props.displayOptions.hideBotMessages ?? false;
    const hideThreadOnlyMessages = this.props.displayOptions.hideThreadOnlyMessages ?? false;

    if (hideBotMessages) {
      const isBotMessage =
        message.subtype === 'bot_message' ||
        typeof message.bot_id === 'string' ||
        message.user === 'USLACKBOT';
      if (isBotMessage) {
        return false;
      }
    }

    if (hideThreadOnlyMessages) {
      const isThreadOnlyMessages =
        typeof message.thread_ts === 'string' &&
        message.thread_ts !== message.ts &&
        message.subtype !== 'thread_broadcast';
      const isExcluded =
        location.pathname.startsWith('/search/') ||
        location.pathname.startsWith('/thread/');
      if (isThreadOnlyMessages && !isExcluded) {
        return false;
      }
    }

    return true;
  }
  render() {
    this.tsToNode = {};

    const createMessages = (messages) => messages.flatMap(message => (
        this.showMessage(message) ? [
          <SlackMessage
            message={message}
            users={this.props.users}
            emojis={this.props.emojis}
            teamInfo={this.props.teamInfo}
            channels={this.props.channels}
            ims={this.props.ims}
            key={message.ts}
            type={this.props.messagesInfo.type}
            selected={message.ts === this.props.scrollToTs}
            messageRef={ n => this.tsToNode[message.ts] = n } />
        ] : []
      ));
    const loadMoreSection = (isPast) => {
      if (!this.props.onLoadMoreMessages) {
        return;
      }
      if (isPast && !this.props.hasMorePastMessage) {
        return;
      }
      if (!isPast && !this.props.hasMoreFutureMessage) {
        return;
      }

      if (this.state.isLoadingMore && this.state.isLoadingPast === isPast) {
        return <div className="messages-load-more loading">Loading...</div>;
      } else {
        return (
          <div className="messages-load-more" onClick={this.handleLoadMore.bind(this, isPast)}>
            Load more messages...
          </div>
        );
      }
    };

    return (
      <div className="messages-list" ref="messagesList">
        {loadMoreSection(true)}
        {createMessages(this.props.messages)}
        {loadMoreSection(false)}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    messages: state.messages.messages,
    hasMorePastMessage: state.messages.hasMorePastMessage,
    hasMoreFutureMessage: state.messages.hasMoreFutureMessage,
    messagesInfo: state.messages.messagesInfo,
    users: state.users,
    channels: state.channels.channels,
    ims: state.channels.ims,
    emojis: state.emojis,
    teamInfo: state.teamInfo,
    displayOptions: state.displayOptions,
  };
};

export default connect(mapStateToProps)(MessagesList);
