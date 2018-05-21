import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import styled from 'styled-components';

import { GREY } from '../../../constants';
import Config from '../../../../config.json';
import { Icon } from '../../shared';

const LabelContainer = styled.View`
  align-items: center;
  flex-direction: row;
  margin-bottom: 3;
`;

const StyledLabelText = styled.Text`
  color: ${GREY};
  font-family: 'flex-font';
  font-size: 14;
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
        <LabelContainer>
          <StyledLabelText>
            {this.props.label}
          </StyledLabelText>
          {this.props.hasFlashCredit && (
            <Icon
              iconName="bolt"
              size={15}
              color={GREY}
              style={{ marginLeft: 8 }}
              padding={0}
            />
          )}
        </LabelContainer>
        <StyledValueText>
          {this.props.value}
        </StyledValueText>
      </View>
    );
  }
}

BalanceDisplay.defaultProps = {
  hasFlashCredit: false,
};

BalanceDisplay.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  hasFlashCredit: PropTypes.bool,
};

export default BalanceDisplay;
