import React, { PureComponent } from 'react';
import { Button } from 'react-native';
import { connect } from 'react-redux';
import Promise from 'bluebird';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { CreditCardInput } from 'react-native-credit-card-input';
import FadeInView from '../shared/FadeInView';
import GreenCard from './greencc.png';
import GreenCardFront from './greenccfront.png';
import MaterialPanel from '../shared/MaterialPanel';
import { BLACK } from '../../constants';
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
  /**
   * @constructor
   * @param {object} props from parent
   * @constructs CartPage
   */
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
      isEditing: false,
    };

    this.onChange = this.onChange.bind(this);
    this.updateCreditCard = this.updateCreditCard.bind(this);
    this.handleEditCC = this.handleEditCC.bind(this);
  }

  /**
   * @returns {undefined}
   */
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

    this.props.setLoading(true);
    this.setState({ isEditing: false });
    await new Promise(resolve => this.props.updateCreditCard(payload, resolve));
    this.props.setLoading(false);
  }

  /**
   * @returns {undefined}
   */
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
   * @returns {undefined}
   */
  handleEditCC() {
    this.setState({
      isEditing: !this.state.isEditing,
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

    let creditCardDisplay;
    let displayHeight;

    if (this.state.isEditing || !hasCC) {
      creditCardDisplay = creditCardInput;
      displayHeight = 350;
    } else if (this.state.valid || hasCC) {
      creditCardDisplay = paymentDisplay;
      displayHeight = 180;
    }

    if (this.props.isLoading) {
      return (
        <MaterialPanel
          height={displayHeight}
          style={{ shadowOffset: { width: 3, height: 3 } }}
          heading="Payment Info"
        >
          <StyledText>Loading...</StyledText>
        </MaterialPanel>
      );
    }

    return (
      <MaterialPanel
        height={displayHeight}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Payment Info"
      >
        <StyledPaymentView>
          {creditCardDisplay}
        </StyledPaymentView>
        <Button title={`${this.state.isEditing ? 'Cancel' : 'Update payment info'}`} onPress={this.handleEditCC} />
      </MaterialPanel>
    );
  }
}

PaymentInfo.propTypes = {
  creditCard: PropTypes.shape(),
  updateCreditCard: PropTypes.func,
  isLoading: PropTypes.bool,
  setLoading: PropTypes.func,
};

const mapStateToProps = state => ({
  creditCard: state.creditCard,
});

const mapDispatchToProps = {
  updateCreditCard,
};

export default connect(mapStateToProps, mapDispatchToProps)(PaymentInfo);
