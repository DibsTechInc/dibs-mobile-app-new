import React, { PureComponent, TextInput, View } from 'react';
import { CreditCardInput } from 'react-native-credit-card-input';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { MaterialPanelView } from '../styled';

const StyledPaymentView = styled.View`
  margin: 20px;
  flex: 1;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16px;
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PaymentInfo extends PureComponent {
  onChange = (formData) => console.log(JSON.stringify(formData, null, " "));
  onFocus = (field) => console.log("focusing", field);
  /**
   * @returns {JSX} XML
   */
  render() {
    const labels = {
      number: 'Card Number',
      expiry: 'Expiration',
      cvc: 'CVC',
    };

    return (
      <MaterialPanelView
        height={280}
        style={{ shadowOffset: { width: 3, height: 3 } }}
      >
        <StyledPaymentView>
          <CreditCardInput
            requiresCVC

            cardFontFamily="flex-font"

            cardScale={0.8}
            labels={labels}

            validColor="black"
            invalidColor="red"
            placeholderColor="darkgray"

            onFocus={this.onFocus}
            onChange={this.onChange}
          />
        </StyledPaymentView>
      </MaterialPanelView>
    );
  }
}

PaymentInfo.propTypes = {};

export default PaymentInfo;
