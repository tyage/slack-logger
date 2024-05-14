import React, { Component } from 'react';
import MrkdwnText from './MrkdwnText';

import './Element.less';

export class Text extends Component {
  render() {
    const {text} = this.props;
    if (text.type === 'mrkdwn') {
      return <MrkdwnText text={text.text} />;
    }
    if (text.type === 'plain_text') {
      return <span className="plain-text">{text.text}</span>;
    }
    return (
      <span style={{color: 'red'}}>
        ERROR: Unsupported text type: {text.type}
      </span>
    );
  }
}

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isHidden: true,
    };
    this.handleToggleRawData = this.handleToggleRawData.bind(this);
  }

  handleToggleRawData() {
    this.setState((state) => ({
      isHidden: !state.isHidden,
    }));
  }

  render() {
    const {element} = this.props;

    if (element.type === 'button') {
      return (
        <span className="slack-message-element">
          <button
            className={`slack-message-button slack-message-button-${element.style || 'default'}`}
            onClick={this.props.onClick}
            disabled
          >
            <Text text={element.text} />
          </button>
        </span>
      );
    }

    return (
      <span className="slack-message-element">
        <div className="slack-message-unsupported-element" onClick={this.handleToggleRawData}>
          ⚠️ Unsupported element (click to show raw data)
        </div>
        { !this.state.isHidden && (
          <pre className="slack-message-element-raw">
            {JSON.stringify(element, null, '  ')}
          </pre>
        ) }
      </span>
    );
  }
}