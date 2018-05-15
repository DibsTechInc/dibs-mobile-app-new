import React, { PureComponent } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { connect } from 'react-redux';
import Promise from 'bluebird';
import PropTypes from 'prop-types';

import { CreditCardInput } from 'react-native-credit-card-input';
import { FadeInView, MaterialPanel } from '../../shared';
import GreenCard from './greencc.png';
import GreenCardFront from './greenccfront.png';
import Config from '../../../../config.json';
import { updateCreditCard } from '../../../actions/CreditCardActions';
import CreditCardDisplay from './CreditCardDisplay';

import AmexIcon from './stp_card_amex.png';
import DinersIcon from './stp_card_diners.png';
import DiscoverIcon from './stp_card_discover.png';
import JCBIcon from './stp_card_jcb.png';
import MasterCardIcon from './stp_card_mastercard.png';
import UnknownIcon from './stp_card_unknown.png';
import VisaIcon from './stp_card_visa.png';

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
    };

    this.onChange = this.onChange.bind(this);
    this.updateCreditCard = this.updateCreditCard.bind(this);
  }

  /**
   * @param {object} formData the form for CC
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
    }, () => this.state.valid && this.updateCreditCard());
  }

  /**
   * @param {string} type the type of card
   * @returns {string} formatted type
   */
  formatCardIconType(type) {
    let formattedType = type;

    if (type.indexOf('-') === -1) {
      formattedType = type.split(' ').join('-');
    }

    return formattedType;
  }

    /**
   * @returns {undefined}
   */
  async updateCreditCard() {
    const hasCC = this.props.creditCard.expMonth;

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
    await new Promise(resolve => this.props.updateCreditCard(payload, resolve));

    if (hasCC) this.props.setEditCC();
    this.props.setLoading(false);
  }

  /**
   * @param {string} type the type of card
   * @returns {object} the image used for the card
   */
  renderCardIcon(type) {
    let initialType = type;

    // normalize for the card library to display properly
    if (type === 'mastercard') {
      initialType = 'master-card';
    } else if (type === 'dinersclub') {
      initialType = 'diners-club';
    } else if (type === 'americanexpress') {
      initialType = 'american-express';
    }

    const iconMap = {
      visa: VisaIcon,
      'master-card': MasterCardIcon,
      discover: DiscoverIcon,
      'diners-club': DinersIcon,
      jcb: JCBIcon,
      'american-express': AmexIcon,
    };

    const formattedType = this.formatCardIconType(initialType);

    return iconMap[formattedType] ? iconMap[formattedType] : UnknownIcon;
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    const hasCC = this.props.creditCard.expMonth;
    const displayStyle = (this.state.valid || hasCC || this.props.isUpdatingCard) ?
    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } :
    {};

    let paymentDisplay;

    const labels = {
      number: 'Card Number',
      expiry: 'Expiration',
      cvc: 'CVC',
    };

    const creditCardInput = (<CreditCardInput
      requiresCVC

      cardFontFamily="flex-font"
      cardImageBack={GreenCard}
      cardImageFront={GreenCardFront}

      cardScale={0.7}
      labels={labels}
      allowScroll
      labelStyle={{ paddingTop: 10 }}

      validColor="black"
      invalidColor="red"
      placeholderColor="darkgray"

      onChange={this.onChange}
    />);

    if (hasCC) {
      const displayCCNum = `•••• •••• •••• ${this.props.creditCard.last4}`;
      const displayDate = `${this.props.creditCard.expMonth}/${this.props.creditCard.expYear}`;
      const cardIcon = this.renderCardIcon(this.props.creditCard.type);

      paymentDisplay = (
        <CreditCardDisplay
          displayStyle={displayStyle}
          cardIcon={cardIcon}
          displayCCNum={displayCCNum}
          displayDate={displayDate}
        />
      );
    }

    if (this.state.valid) {
      const len = this.state.number.split(' ').length;
      const lastFour = this.state.number.split(' ')[len - 1];
      const displayCCNum = `•••• •••• •••• ${lastFour}`;
      const cardIcon = this.renderCardIcon(this.state.type);

      paymentDisplay = (
        <CreditCardDisplay
          displayStyle={displayStyle}
          cardIcon={cardIcon}
          displayCCNum={displayCCNum}
          displayDate={this.state.expiry}
        />
      );
    }

    let creditCardDisplay;
    let displayHeight;

    if (this.props.isUpdatingCard || !hasCC) {
      creditCardDisplay = creditCardInput;
      displayHeight = 320;
    } else if (this.state.valid || hasCC) {
      creditCardDisplay = paymentDisplay;
      displayHeight = 120;
    }

    let editLabel;

    if (hasCC) {
      editLabel = this.props.isUpdatingCard ? 'Cancel' : 'Change';
    }

    if (this.props.isLoading) {
      return (
        <MaterialPanel
          height={displayHeight}
          style={{ shadowOffset: { width: 3, height: 3 } }}
          heading="Payment Info"
          headingRight={editLabel}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10 }}
        >
          <View style={{ justifyContent: 'center', alignItems: 'center', margin: 10, height: 220 }}>
            <ActivityIndicator />
          </View>
        </MaterialPanel>
      );
    }

    return (
      <MaterialPanel
        height={displayHeight}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Payment Info"
        headingRight={editLabel}
        headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
        headerStyle={{ marginLeft: 10 }}
        onPressHeadingRight={this.props.setEditCC}
      >
        <FadeInView>
          {creditCardDisplay}
        </FadeInView>
      </MaterialPanel>
    );
  }
}

PaymentInfo.propTypes = {
  creditCard: PropTypes.shape().isRequired,
  updateCreditCard: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  setLoading: PropTypes.func.isRequired,
  isUpdatingCard: PropTypes.bool.isRequired,
  setEditCC: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  creditCard: state.creditCard,
});

const mapDispatchToProps = {
  updateCreditCard,
};

export default connect(mapStateToProps, mapDispatchToProps)(PaymentInfo);
