import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CustomWebView } from '../shared';

/**
 * @class TermsAndConditions
 * @extends {React.Component}
 */
class TermsAndConditions extends Component {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    console.log(this.props.navigation, '??')
    return <CustomWebView url={this.props.navigation.state.params.url} />;
  }
}

TermsAndConditions.propTypes = {
  navigation: PropTypes.shape(),
};

export default TermsAndConditions;
