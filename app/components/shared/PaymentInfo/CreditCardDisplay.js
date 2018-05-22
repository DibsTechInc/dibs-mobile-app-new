import React, { PureComponent } from 'react';
import { View, Image } from 'react-native';
import PropTypes from 'prop-types';

import { FadeInView } from '../../shared';
import { NormalText } from '../../styled';

/**
 * @class CreditCardDisplay
 * @extends Component
 */
class CreditCardDisplay extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={this.props.displayStyle}>
        <View>
          <Image source={this.props.cardIcon} style={{ aspectRatio: 0.5, resizeMode: 'contain' }} />
        </View>
        <NormalText>{this.props.displayCCNum}</NormalText>
        <NormalText>{this.props.displayDate}</NormalText>
      </FadeInView>
    );
  }
}

CreditCardDisplay.propTypes = {
  displayCCNum: PropTypes.string.isRequired,
  displayDate: PropTypes.string.isRequired,
  cardIcon: PropTypes.number.isRequired,
  displayStyle: PropTypes.shape(),
};

export default CreditCardDisplay;
