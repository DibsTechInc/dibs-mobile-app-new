import React, { PureComponent } from 'react';
import { withNavigation } from 'react-navigation';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import {
  CustomWebView,
  FadeInView,
  CustomStatusBar,
  BackArrow,
} from '../shared';
import { BLACK } from '../../constants';
/**
 * @class TermsAndConditions
 * @extends {React.Component}
 */
class TermsAndConditions extends PureComponent {
  /**
   * @constructor
   * @constructs TermsAndConditions
   * @param {Object} props for component
   */
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  handleOnPress() {
    this.props.navigation.goBack();
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView>
        <CustomStatusBar backgroundColor={'transparent'} barStyle="dark-content" />
        <View style={{ height: 50, backgroundColor: '#f5f5f5' }}>
          <BackArrow
            onPress={this.handleOnPress}
            style={{ marginLeft: 15, marginTop: 10 }}
            stroke={BLACK}
          />
        </View>
        <CustomWebView url={this.props.navigation.state.params.url} />
      </FadeInView>
    );
  }
}

TermsAndConditions.propTypes = {
  navigation: PropTypes.shape(),
};

export default withNavigation(TermsAndConditions);
