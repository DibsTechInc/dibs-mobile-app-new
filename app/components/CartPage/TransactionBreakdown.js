import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialPanel from '../shared/MaterialPanel';

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
      <MaterialPanel
        heading="Order Summary"
        style={{ shadowOffset: { width: 3, height: 3 } }}
      >
        <StyledBreakDownView>
          <StyledText>Subtotal...............${this.props.formattedSubtotal}</StyledText>
          <StyledText>Tax Amount...............${this.props.formattedTaxAmount}</StyledText>
          <StyledText>Total...............${this.props.formattedTotal}</StyledText>
        </StyledBreakDownView>
      </MaterialPanel>
    );
  }
}

TransactionBreakdown.propTypes = {
  formattedSubtotal: PropTypes.string,
  formattedTotal: PropTypes.string,
  formattedTaxAmount: PropTypes.string,
};

export default TransactionBreakdown;
