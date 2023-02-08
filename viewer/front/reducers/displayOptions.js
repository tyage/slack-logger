import SlackConstants from '../constants/SlackConstants';

const DEFAULT_OPTIONS = {
  hideBotMessages: false,
  hideThreadOnlyMessages: true,
};

const displayOptions = (state = DEFAULT_OPTIONS, action) => {
  switch (action.type) {
    case SlackConstants.UPDATE_DISPLAY_OPTION:
      return {
        ...state,
        [action.option]: action.value,
      };
    default:
      return state;
  }
};

export default displayOptions;

