import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { WebView, Alert } from 'react-native';

/**
 * @class CustomWebView
 * @extends Component
 */
class CustomWebView extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <WebView
        source={{
          uri: this.props.url,
        }}
        bounces={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      />
    );
  }
}

CustomWebView.propTypes = {
  url: PropTypes.string,
};

export default CustomWebView;

