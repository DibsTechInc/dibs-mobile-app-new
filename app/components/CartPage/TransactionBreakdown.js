import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { MaterialPanelView } from '../styled';

const StyledBreakDownView = styled.View`
  margin: 20px;
  height: auto;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16;
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class TransactionBreakdown extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <MaterialPanelView>
        <StyledBreakDownView>
          <StyledText>Subtotal...............${this.props.formattedSubtotal}</StyledText>
          <StyledText>Tax Amount...............${this.props.formattedTaxAmount}</StyledText>
          <StyledText>Total...............${this.props.formattedTotal}</StyledText>
        </StyledBreakDownView>
      </MaterialPanelView>
    );
  }
}

TransactionBreakdown.propTypes = {
  formattedSubtotal: PropTypes.string,
  formattedTotal: PropTypes.string,
  formattedTaxAmount: PropTypes.string,
};

export default TransactionBreakdown;
