import SlackConstants from '../constants/SlackConstants';
import MessagesType from '../constants/MessagesType';
import { push } from 'connected-react-router'
import 'whatwg-fetch'

const generateApiUrl = (url) => url + '?t=' + (new Date()).getTime();

// callback becomes callable if it is passed to this function last time
let _lastCallback;
const callableIfLast = (callback) => {
  _lastCallback = callback;
  return (...args) => {
    if (_lastCallback === callback) {
      callback(...args);
    }
  };
};

const fetchJSON = (url, params) => {
  const defaultParam = {
    credentials: 'same-origin'
  };
  params = Object.assign(defaultParam, params);
  return fetch(url, params).then(res => res.json());
};

export default {
  getChannels() {
    return dispatch => (
      fetchJSON(generateApiUrl('channels.json')).then((channels) => {
        dispatch({
          type: SlackConstants.UPDATE_CHANNELS,
          channels
        });
      })
    );
  },
  getIms() {
    return dispatch => (
      fetchJSON(generateApiUrl('ims.json')).then((ims) => {
        dispatch({
          type: SlackConstants.UPDATE_IMS,
          ims
        });
      })
    );
  },
  getUsers() {
    return dispatch => (
      fetchJSON(generateApiUrl('users.json')).then((users) => {
        dispatch({
          type: SlackConstants.UPDATE_USERS,
          users
        });
      })
    );
  },
  getEmojis() {
    return dispatch => (
      fetchJSON(generateApiUrl('emojis.json')).then((emojis) => {
        dispatch({
          type: SlackConstants.UPDATE_EMOJIS,
          emojis
        });
      })
    );
  },
  getAroundMessages(channel, ts) {
    return dispatch => {
      dispatch({
        type: SlackConstants.START_UPDATE_MESSAGES
      });

      const updateMessage = callableIfLast(({ messages, has_more_past_message: hasMorePastMessage, has_more_future_message: hasMoreFutureMessage }) => {
        dispatch({
          type: SlackConstants.UPDATE_MESSAGES,
          messages,
          hasMorePastMessage,
          hasMoreFutureMessage,
          messagesInfo: {
            type: MessagesType.CHANNEL_MESSAGES,
            channel
          }
        });
      });

      const url = generateApiUrl('around_messages/' + channel + '.json');
      const params = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: `ts=${ts}` // TODO: post as json format
      };
      fetchJSON(url, params).then(updateMessage);
    };
  },
  getMessages(channel) {
    return dispatch => {
      dispatch({
        type: SlackConstants.START_UPDATE_MESSAGES
      });

      const updateMessage = callableIfLast(({ messages, has_more_message: hasMoreMessage }) => {
        dispatch({
          type: SlackConstants.UPDATE_MESSAGES,
          messages,
          hasMorePastMessage: hasMoreMessage,
          messagesInfo: {
            type: MessagesType.CHANNEL_MESSAGES,
            channel
          }
        });
      });

      const url = generateApiUrl('messages/' + channel + '.json');
      const params = {
        method: 'POST'
      };
      fetchJSON(url, params).then(updateMessage);
    };
  },
  getMoreMessages(channel, { isPast, limitTs }) {
    return dispatch => {
      const updateMessage = callableIfLast(({ messages, has_more_message: hasMoreMessage }) => {
        dispatch({
          type: isPast ? SlackConstants.UPDATE_MORE_PAST_MESSAGES : SlackConstants.UPDATE_MORE_FUTURE_MESSAGES,
          messages,
          hasMoreMessage
        });
      });

      const url = generateApiUrl('messages/' + channel + '.json');
      const params = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' // TODO: post as json format
        },
        body: `${isPast ? 'max_ts' : 'min_ts'}=${limitTs}`
      };
      fetchJSON(url, params).then(updateMessage);
    };
  },
  getThreadMessages(threadTs) {
    return dispatch => {
      const updateMessage = callableIfLast(({ messages }) => {
        dispatch({
          type: SlackConstants.UPDATE_MESSAGES,
          messages,
          hasMorePastMessage: false,
          hasMoreFutureMessage: false,
          messagesInfo: {
            type: MessagesType.THREAD_MESSAGES,
            threadTs,
          }
        });
      });

      const url = generateApiUrl('thread_messages.json');
      const params = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' // TODO: post as json format
        },
        body: `thread_ts=${threadTs}`,
      };
      fetchJSON(url, params).then(updateMessage);
    };
  },
  getTeamInfo() {
    return (dispatch) => (
      fetchJSON(generateApiUrl('team.json')).then((teamInfo) => {
        dispatch({
          type: SlackConstants.UPDATE_TEAM_INFO,
          teamInfo
        });
      })
    );
  },
  importBackup(formData) {
    return dispatch => {
      const url = generateApiUrl('import_backup');
      fetchJSON(url, {
        method: 'post',
        body: formData
      });
    };
  },
  openSidebar() {
    return dispatch => {
      dispatch({
        type: SlackConstants.OPEN_SIDEBAR,
      });
    };
  },
  closeSidebar() {
    return dispatch => {
      dispatch({
        type: SlackConstants.CLOSE_SIDEBAR,
      });
    };
  },
  setDisplayOption(option, value) {
    return dispatch => {
      dispatch({
        type: SlackConstants.UPDATE_DISPLAY_OPTION,
        option,
        value,
      });
    };
  },
  updateSearchWord(word) {
    return push(`/search/${encodeURIComponent(word)}`);
  },
  search(word) {
    return dispatch => {
      dispatch({
        type: SlackConstants.START_UPDATE_MESSAGES
      });

      const updateMessage = callableIfLast(({ messages, has_more_message: hasMoreMessage }) => {
        dispatch({
          type: SlackConstants.UPDATE_MESSAGES,
          messages,
          hasMorePastMessage: hasMoreMessage,
          messagesInfo: {
            type: MessagesType.SEARCH_MESSAGES,
            searchWord: word
          }
        });
      });

      const url = generateApiUrl('search');
      const params = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: `word=${encodeURIComponent(word)}` // TODO: post json format
      };
      fetchJSON(url, params).then(updateMessage);
    };
  },
  searchMore(word, { isPast, limitTs }) {
    return dispatch => {
      const updateMessage = callableIfLast(({ messages, has_more_message: hasMoreMessage }) => {
        dispatch({
          type: isPast ? SlackConstants.UPDATE_MORE_PAST_MESSAGES : SlackConstants.UPDATE_MORE_FUTURE_MESSAGES,
          messages,
          hasMoreMessage,
        });
      });

      const url = generateApiUrl('search');
      const params = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: `word=${encodeURIComponent(word)}&${isPast ? 'max_ts' : 'min_ts'}=${limitTs}` // TODO: post json format
      };
      fetchJSON(url, params).then(updateMessage);
    };
  }
};
