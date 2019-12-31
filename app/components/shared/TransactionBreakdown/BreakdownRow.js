import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Dash from 'react-native-dash';

import { WHITE } from '../../../constants';
import { FlexRow, NormalText } from '../../styled';

const StyledView = styled(FlexRow)`
  align-items: center;
  margin-left: 10;
  width: 90%;
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
        marginBottom: 10,
      }}
      >
        <NormalText style={this.props.labelStyle}>
          {this.props.label}:
        </NormalText>
        <Dash
          style={{ flex: 1, marginTop: 16 }}
          dashGap={5}
          dashThickness={1.5}
          dashColor={WHITE}
          dashLength={2}
        />
        <NormalText style={this.props.valueStyle}>
          {this.props.value}
        </NormalText>
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
