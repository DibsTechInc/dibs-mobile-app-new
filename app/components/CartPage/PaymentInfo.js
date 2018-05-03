import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledPaymentView = styled.View`
  margin: 20px;
  height: 185px;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PaymentInfo extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledPaymentView>
        <StyledText>Payment Info</StyledText>
      </StyledPaymentView>
    );
  }
}

PaymentInfo.propTypes = {};

export default PaymentInfo;
