import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import styled from 'styled-components';
import { GREY } from '../../../constants';
import Config from '../../../../config.json';

const StyledLabelText = styled.Text`
  color: ${GREY};
  font-family: 'flex-font';
  font-size: 14;
  margin-bottom: 3;
`;

const StyledValueText = styled.Text`
  color: ${Config.STUDIO_COLOR};
  font-size: 20;
  margin-bottom: 10;
`;

/**
 * @class BalanceDisplay
 * @extends {React.PureComponent}
 */
class BalanceDisplay extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View>
        <StyledLabelText>
          {this.props.label}
        </StyledLabelText>
        <StyledValueText>
          {this.props.value}
        </StyledValueText>
      </View>
    );
  }
}

BalanceDisplay.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default BalanceDisplay;
