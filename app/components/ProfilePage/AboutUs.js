import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getStudioName } from '../../selectors';
import Header from '../Header';
import { NormalText } from '../styled';
import { FadeInView } from '../shared';

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
      <FadeInView>
        <Header title="About Us" />
        <FadeInView style={{ padding: 10, justifyContent: 'center', alignItems: 'center' }}>
          <NormalText>
            Why Book with Dynamic Pricing?
          </NormalText>
          <NormalText>
            We want to offer you the best price we can, always.
            We’ve partnered with Dibs Technology to dynamically price each spot, in every class, based on demand.
            Prices are at their lowest when the class is empty, and increases as it fills. That means you get the best price for booking early.
          </NormalText>
          <NormalText>
            Love {this.props.studioName} and plan to keep coming back? Look out for flash credits! These credits are Core’s way of thanking you for booking regularly.
          </NormalText>
          <NormalText>
            TIP: Book early and often for better prices.
          </NormalText>
        </FadeInView>
      </FadeInView>
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

