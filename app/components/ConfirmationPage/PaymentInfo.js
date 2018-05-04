import React, { PureComponent, TextInput, View } from 'react';
import { connect } from 'react-redux';
import Promise from 'bluebird';
import _ from 'lodash';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { CreditCardInput } from 'react-native-credit-card-input';
import FadeInView from '../shared/FadeInView';
import GreenCard from './greencc.png';
import GreenCardFront from './greenccfront.png';
import MaterialPanel from '../shared/MaterialPanel';
import { WHITE, LIGHT_GREY, SOFT_GREY, BLACK } from '../../constants';
import Config from '../../../config.json';
import { updateCreditCard } from '../../actions/CreditCardActions';

const StyledPaymentView = styled.View`
  margin: 20px;
  flex: 1;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16px;
`;

const StyledButtonText = StyledText.extend`
  font-size: 12px;
  color: ${BLACK}
`;

const StyledContinueButton = styled.TouchableOpacity`
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: ${Config.STUDIO_COLOR};
  border-radius: 5px;
  border-width: 1px;
  border-color: ${Config.STUDIO_COLOR};
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PaymentInfo extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      valid: false,
      numberStatus: 'incomplete',
      expiryStatus: 'incomplete',
      cvcStatus: 'incomplete',
      number: '',
      expiry: '',
      cvc: '',
      type: '',
      isLoading: false,
    };

    this.onChange = this.onChange.bind(this);
    this.updateCreditCard = this.updateCreditCard.bind(this);
  }

  async updateCreditCard() {
    // ccNum, ccCVC, expiration
    const month = this.state.expiry.split('/')[0];
    const year = this.state.expiry.split('/')[1];

    const payload = {
      ccNum: this.state.number,
      ccCVC: this.state.cvc,
      expiration: {
        month,
        year,
      },
    };

    console.log(payload, 'morrre payload')

    this.setState({ isLoading: true });

    await new Promise(res => this.props.updateCreditCard(payload, res));

    this.setState({ isLoading: false });
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
    }, () => {
      if (this.state.valid) {
        this.updateCreditCard();
      }
    });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    const hasCC = this.props.creditCard.expMonth;
    const displayStyle = (this.state.valid || hasCC || this.state.isEditing) ? { flexDirection: 'row', justifyContent: 'space-between' } : {};
    let paymentDisplay;

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

      onChange={this.onChange}
    />);

    console.log(hasCC);
    if (hasCC) {
      const displayCCNum = `•••• •••• •••• ${this.props.creditCard.last4}`;
      const displayDate = `${this.props.creditCard.expMonth}/${this.props.creditCard.expYear}`;
      paymentDisplay = (
        <FadeInView style={displayStyle}>
          <StyledText>{displayCCNum}</StyledText>
          <StyledText>{displayDate}</StyledText>
        </FadeInView>
      );
    }

    console.log(this.props.creditCard, 'card')

    if (this.state.valid) {
      const len = this.state.number.split(' ').length;
      const lastFour = this.state.number.split(' ')[len - 1];
      const displayCCNum = `•••• •••• •••• ${lastFour}`;

      paymentDisplay = (
        <FadeInView style={displayStyle}>
          <StyledText>{displayCCNum}</StyledText>
          <StyledText>{this.state.expiry}</StyledText>
        </FadeInView>
      );
    }

    const creditCardDisplay = (this.state.valid || hasCC) ? paymentDisplay : creditCardInput;
    const displayHeight = (this.state.valid || hasCC) ? 140 : 350;

    return (
      <MaterialPanel
        height={displayHeight}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Payment Info"
      >
        <StyledPaymentView>
          {creditCardDisplay}
        </StyledPaymentView>
      </MaterialPanel>
    );
  }
}

PaymentInfo.propTypes = {
  creditCard: PropTypes.shape(),
  navigation: PropTypes.shape(),
  updateCreditCard: PropTypes.func,
};

const mapDispatchToProps = {
  updateCreditCard,
};

export default connect(null, mapDispatchToProps)(PaymentInfo);
