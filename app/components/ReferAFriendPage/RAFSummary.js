import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { HeavyText, NormalText } from '../styled';
import { GREY } from '../../constants';

/**
 * @class RAFSummary
 * @extends {React.PureComponent}
 */
class RAFSummary extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View style={{ marginTop: 20 }}>
        <View>
          <HeavyText size="25px">
            Tell your friends!
          </HeavyText>
          <HeavyText size="25px">
            Gift {this.props.earnedAmount} & Earn {this.props.earnedAmount}
          </HeavyText>
        </View>
        <View style={{ marginTop: 20, width: '90%' }}>
          <NormalText color={GREY}>
            Invite your friends to book a class with {this.props.studioName}!
          </NormalText>
          <NormalText color={GREY} style={{ marginTop: 5 }}>
            They earn {this.props.earnedAmount} towards their first class when they sign up and you will earn {this.props.earnedAmount} once they book.
          </NormalText>
        </View>
      </View>
    );
  }
}

RAFSummary.defaultProps = {
  earnedAmount: '$5',
  studioName: 'STUDIO_NAME',
};

RAFSummary.propTypes = {
  earnedAmount: PropTypes.string,
  studioName: PropTypes.string,
};

export default RAFSummary;
