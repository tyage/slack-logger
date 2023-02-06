import React from 'react';
import { connect } from 'react-redux'
import SlackActions from '../actions/SlackActions';

import './DisplayOption.less';

class DisplayOption extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.displayOptions[props.option] ?? false,
    };
  }
  onChange(e) {
    this.props.setDisplayOption(this.props.option, e.target.checked);
    this.setState({
      checked: e.target.checked,
    });
  }
  render() {
    return (
      <span className="display-option">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={this.state.checked}
            onChange={this.onChange.bind(this)}
          />
          {this.props.children}
        </label>
      </span>
    );
  }
}

const mapStateToProps = state => {
  return {
    displayOptions: state.displayOptions,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setDisplayOption: (option, value) => {
      dispatch(SlackActions.setDisplayOption(option, value));
    },
  };
};
const ConnectedDisplayOption = connect(mapStateToProps, mapDispatchToProps)(DisplayOption);

export default ConnectedDisplayOption;

