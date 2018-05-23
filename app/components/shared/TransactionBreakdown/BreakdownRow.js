import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Dash from 'react-native-dash';

import { WHITE } from '../../../constants';
import { FlexRow } from '../../styled';

const StyledView = FlexRow.extend`
  align-items: center;
  margin-bottom: 5;
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
      <StyledView style={{
        ...this.props.containerStyle,
        marginBottom: 20,
      }}
      >
        <StyledText style={this.props.labelStyle}>
          {this.props.label}:
        </StyledText>
        <Dash
          style={{ flex: 1, marginTop: 14 }}
          dashGap={5}
          dashThickness={1.5}
          dashColor={WHITE}
          dashLength={2}
        />
        <StyledText style={this.props.valueStyle}>
          {this.props.value}
        </StyledText>
      </StyledView>
    );
  }
}

BreakdownRow.defaultProps = { dots: true };

BreakdownRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  containerStyle: PropTypes.shape(),
  labelStyle: PropTypes.shape(),
  valueStyle: PropTypes.shape(),
  dots: PropTypes.bool,
};

export default BreakdownRow;
