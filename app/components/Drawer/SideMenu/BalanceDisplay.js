import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import styled from 'styled-components';

import { GREY } from '../../../constants';
import Config from '../../../../config.json';
import { Icon } from '../../shared';
import { NormalText } from '../../styled';

const LabelContainer = styled.View`
  align-items: center;
  flex-direction: row;
  margin-bottom: 3;
`;

const StyledLabelText = styled(NormalText)`
  color: ${GREY};
`;

const StyledValueText = styled(NormalText)`
  color: ${Config.STUDIO_COLOR};
  font-size: 16;
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
      <View style={{ marginBottom: 10 }}>
        <LabelContainer>
          <StyledLabelText>
            {this.props.label}
          </StyledLabelText>
          {!!this.props.hasFlashCredit && (
            <Icon
              iconName="bolt"
              size={15}
              color={GREY}
              style={{ marginLeft: 8 }}
              padding={0}
            />
          )}
        </LabelContainer>
        {Array.isArray(this.props.value) ? (
          this.props.value.map(value => (
            <StyledValueText key={value} numberOfLines={1}>
              {value}
            </StyledValueText>
          ))
        ) : (
            <StyledValueText numberOfLines={1}>
              {this.props.value}
            </StyledValueText>
          )}
      </View>
    );
  }
}

BalanceDisplay.defaultProps = {
  hasFlashCredit: false,
};

BalanceDisplay.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  hasFlashCredit: PropTypes.bool,
};

export default BalanceDisplay;
