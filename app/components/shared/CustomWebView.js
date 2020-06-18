import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';

/**
 * @class CustomWebView
 * @extends Component
 */
class CustomWebView extends PureComponent {
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
        scrollEnabled
        style={{ flex: 1 }}
      />
    );
  }
}

CustomWebView.propTypes = {
  url: PropTypes.string,
};

export default CustomWebView;

