import React, { PureComponent } from 'react';
import { View, Image } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import FadeInView from '../shared/FadeInView';

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16px;
`;

class CreditCardDisplay extends PureComponent {
  render() {
    return (
      <FadeInView style={this.props.displayStyle}>
        <View>
          <Image source={this.props.cardIcon} style={{ aspectRatio: 0.5, resizeMode: 'contain' }} />
        </View>
        <StyledText>{this.props.displayCCNum}</StyledText>
        <StyledText>{this.props.displayDate}</StyledText>
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
