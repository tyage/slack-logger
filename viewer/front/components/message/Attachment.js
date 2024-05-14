import React, { Component } from 'react';
import MrkdwnText from './MrkdwnText';

import './Attachment.less';

const formatDate = (date) => (
  new Date(date * 1000).toLocaleString()
);

class Author extends Component {
  render() {
    return (
      <div className="attachment-author">
        {this.props.icon && <img className="attachment-author-icon" src={this.props.icon} />}
        <div className="attachment-author-name">
          {this.props.link ? (
            <a href={this.props.link} target="_blank" rel="noopener noreferrer">
              <MrkdwnText text={this.props.name} />
            </a>
          ) : (
            <MrkdwnText text={this.props.name} />
          )}
        </div>
      </div>
    );
  }
}

class Title extends Component {
  render() {
    return (
      <div className="attachment-title">
        {this.props.link ? (
          <a href={this.props.link} target="_blank" rel="noopener noreferrer">
            <MrkdwnText text={this.props.title} />
          </a>
        ) : (
          <MrkdwnText text={this.props.title} />
        )}
      </div>
    );
  }
}

class Footer extends Component {
  render() {
    return (
      <div className="attachment-footer">
        {this.props.icon && <img className="attachment-footer-icon" src={this.props.icon} />}
        {this.props.text && (
          <div className="attachment-footer-text">
            <MrkdwnText text={this.props.text} />
          </div>
        )}
        {(this.props.icon || this.props.text) && <div className="attachment-footer-separater"/>}
        {this.props.ts && (
          <div className="attachment-footer-ts">{formatDate(this.props.ts)}</div>
        )}
        {this.props.ts && <div className="attachment-footer-separater"/>}
      </div>
    );
  }
}

class Fields extends Component {
  render() {
    const {fields} = this.props;
    return (
      <div className="attachment-fields">
        {
          fields.map((field, index) => (
            <div key={index} className="attachment-field">
              <div className="attachment-field-title">{field.title}</div>
              <div className="attachment-field-value">{field.value}</div>
            </div>
          ))
        }
      </div>
    );
  }
}

export default class extends Component {
  render() {
    const {attachment} = this.props;
    return (
      <div className="slack-message-attachment">
        {attachment.pretext && (
          <div className="attachment-pretext">
            <MrkdwnText text={attachment.pretext} />
          </div>
        )}
        <div className="attachment-main">
          <div className="attachment-sidebar" style={{backgroundColor: `#${attachment.color}`}}></div>
          <div className="attachment-content">
            {attachment.author_name && (
              <Author name={attachment.author_name} link={attachment.author_link} icon={attachment.author_icon}/>
            )}
            {attachment.title && (
              <Title title={attachment.title} link={attachment.title_link}/>
            )}
            {attachment.text && (
              <MrkdwnText text={attachment.text} />
            )}
            {attachment.image_url && (
              <div className="attachment-image-wrap">
                <a href={attachment.image_url} target="_blank" rel="noopener noreferrer">
                  <img className="attachment-image" src={attachment.image_url}/>
                </a>
              </div>
            )}
            {attachment.fields && (
              <Fields fields={attachment.fields} />
            )}
            {(attachment.footer || attachment.footer_icon || attachment.ts) && (
              <Footer text={attachment.footer} icon={attachment.footer_icon} ts={attachment.ts}/>
            )}
          </div>
          {attachment.thumb_url && (
            <a href={attachment.thumb_url} target="_blank" rel="noopener noreferrer">
              <img className="attachment-thumb" src={attachment.thumb_url}/>
            </a>
          )}
        </div>
      </div>
    );
  }
}
