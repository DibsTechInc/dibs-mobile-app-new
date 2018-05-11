import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const StyledView = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const StyledText = styled.Text`
  font-family: flex-font;
  font-size: 14px;
`;


/**
 * @class BreakdownRow
 * @extends {Component}
 */
class BreakdownRow extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView style={this.props.containerStyle}>
        <StyledText style={this.props.labelStyle}>{this.props.label}:</StyledText>
        <StyledText style={this.props.valueStyle}>{this.props.value}</StyledText>
      </StyledView>
    );
  }
}

BreakdownRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  containerStyle: PropTypes.shape(),
  labelStyle: PropTypes.shape(),
  valueStyle: PropTypes.shape(),
};

export default BreakdownRow;
