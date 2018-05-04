import React, { PureComponent, TextInput, View } from 'react';
import { Alert } from 'react-native';
import { CreditCardInput } from 'react-native-credit-card-input';
import FadeInView from '../shared/FadeInView';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import GreenCard from './greencc.png';
import GreenCardFront from './greenccfront.png';
import { MaterialPanelView } from '../styled';

const StyledPaymentView = styled.View`
  margin: 20px;
  flex: 1;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16px;
`;

const ErrorText = StyledText.extend`

`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PaymentInfo extends PureComponent {
  constructor() {
    super();

    this.state = {
      valid: false,
      numberStatus: 'incomplete',
      expiryStatus: 'incomplete',
      cvcStatus: 'incomplete',
      number: '',
      expiry: '',
      cvc: '',
      type: '',
    };

    this.onChange = this.onChange.bind(this);
    this.onFocus = this.onFocus.bind(this);
  }

  onFocus(field) {
    console.log("focusing", field);
  }

  onChange(formData) {
    this.setState({
      valid: formData.valid,
      numberStatus: formData.status.number,
      expiryStatus: formData.status.expiry,
      cvcStatus: formData.status.cvc,
      number: formData.values.number,
      expiry: formData.values.expiry,
      cvc: formData.values.cvc,
      type: formData.values.type,
    });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    const labels = {
      number: 'Card Number',
      expiry: 'Expiration',
      cvc: 'CVC',
    };

    const addtionalInputProps = {
      number: {
        maxLength: 10,
        returnKeyType: 'go',
      },
    };

    const creditCardInput = (<CreditCardInput
      requiresCVC

      cardFontFamily="flex-font"
      cardImageBack={GreenCard}
      cardImageFront={GreenCardFront}

      cardScale={0.8}
      labels={labels}
      addtionalInputProps={addtionalInputProps}

      validColor="black"
      invalidColor="red"
      placeholderColor="darkgray"

      onFocus={this.onFocus}
      onChange={this.onChange}
    />);

    let paymentDisplay;

    if (this.state.valid) {
      const len = this.state.number.split(' ').length;
      const lastFour = this.state.number.split(' ')[len - 1];
      const displayCCNum = `•••• •••• •••• ${lastFour}`;

      paymentDisplay = (<FadeInView>
        <StyledText>Using Credit Card</StyledText>
        <StyledText>{displayCCNum}</StyledText>
        <StyledText>{this.state.expiry}</StyledText>
      </FadeInView>);
    }

    const creditCardDisplay = this.state.valid ? paymentDisplay : creditCardInput;

    return (
      <MaterialPanelView
        height={280}
        style={{ shadowOffset: { width: 3, height: 3 } }}
      >
        <StyledPaymentView>
          {creditCardDisplay}
          {!this.state.valid && <StyledText>Please enter a valid card</StyledText>}
        </StyledPaymentView>
      </MaterialPanelView>
    );
  }
}

PaymentInfo.propTypes = {};

export default PaymentInfo;
