import SlackConstants from '../constants/SlackConstants';

const displayOptions = (state = Object.create(null), action) => {
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

