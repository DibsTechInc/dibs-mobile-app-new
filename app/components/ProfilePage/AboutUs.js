import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';

import { getStudioName } from '../../selectors';
import Header from '../Header';

/**
 * @class AboutUs
 * @extends PureComponent
 */
class AboutUs extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <View>
        <Header title="About Us" />
        <Text>
          Why Book with Dynamic Pricing?
        </Text>
        <Text>
          We want to offer you the best price we can, always.
          We’ve partnered with Dibs Technology to dynamically price each spot, in every class, based on demand.
          Prices are at their lowest when the class is empty, and increases as it fills. That means you get the best price for booking early.
        </Text>
        <Text>
          Love {this.props.studioName} and plan to keep coming back? Look out for flash credits! These credits are Core’s way of thanking you for booking regularly.
        </Text>
        <Text>
          TIP: Book early and often for better prices.
        </Text>
      </View>
    );
  }
}

AboutUs.propTypes = {
  studioName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  studioName: getStudioName(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(AboutUs);

