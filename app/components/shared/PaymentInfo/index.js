import React, { PureComponent } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { LiteCreditCardInput } from 'react-native-credit-card-input';
import Promise from 'bluebird';

import { GREY, LIGHT_GREY } from '../../../constants';
import Config from '../../../../config.json';
import { updateCreditCard } from '../../../actions';
import {
  getCCIsLoading,
  getCCLastFour,
  getCCExpMonth,
  getCCExpYear,
  getCCType,
  getCCIsValid,
  getIfHasNoCC,
} from '../../../selectors';

import { FadeInView, MaterialPanel } from '../../shared';
import CreditCardDisplay from './CreditCardDisplay';
import AmexIcon from '../../../../assets/img/stp_card_amex.png';
import DinersIcon from '../../../../assets/img/stp_card_diners.png';
import DiscoverIcon from '../../../../assets/img/stp_card_discover.png';
import JCBIcon from '../../../../assets/img/stp_card_jcb.png';
import MasterCardIcon from '../../../../assets/img/stp_card_mastercard.png';
import UnknownIcon from '../../../../assets/img/stp_card_unknown.png';
import VisaIcon from '../../../../assets/img/stp_card_visa.png';

/**
 * @class PaymentInfo
 * @extends {Component}
 */
class PaymentInfo extends PureComponent {
  /**
   * @constructor
   * @param {object} props from parent
   * @constructs PaymentInfo
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

    this.setStateAsync = Promise.promisify(this.setState.bind(this));
    this.onChange = this.onChange.bind(this);
    this.updateCreditCard = this.updateCreditCard.bind(this);
  }

  /**
   * @param {object} formData the form for CC
   * @returns {undefined}
   */
  async onChange(formData) {
    await this.setStateAsync({
      valid: formData.valid,
      numberStatus: formData.status.number,
      expiryStatus: formData.status.expiry,
      cvcStatus: formData.status.cvc,
      number: formData.values.number,
      expiry: formData.values.expiry,
      cvc: formData.values.cvc,
      type: formData.values.type,
    });
    if (this.state.valid) this.updateCreditCard();
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
    const { userHasNoCard } = this.props;
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

    await this.props.updateCreditCard(payload);
    if (!userHasNoCard && this.props.hasValidCC) this.props.setEditCC();
    await this.setStateAsync({
      valid: false,
      numberStatus: 'incomplete',
      expiryStatus: 'incomplete',
      cvcStatus: 'incomplete',
      number: '',
      expiry: '',
      cvc: '',
      type: '',
    });
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
    const displayHeight = 120;
    const displayStyle =
      (this.state.valid || this.props.hasValidCC || this.props.isUpdatingCard) ?
        { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }
        : {};
    let editLabel;
    let paymentDisplay = (
      <LiteCreditCardInput
        autoFocus
        cardScale={0.7}
        labels={{
          number: 'Card Number',
          expiry: 'Expiration',
          cvc: 'CVC',
        }}
        allowScroll
        labelStyle={{ paddingTop: 10, fontFamily: 'studio-font' }}
        validColor="black"
        invalidColor="red"
        placeholderColor="darkgray"
        onChange={this.onChange}
        inputStyle={{ fontFamily: 'studio-font' }}
      />
    );

    if (this.props.hasValidCC) {
      editLabel = this.props.isUpdatingCard ? 'Cancel' : 'Update';
    }

    if (this.props.loadingCreditCard) {
      return (
        <MaterialPanel
          height={displayHeight}
          style={{
            shadowOffset: { width: 3, height: 3 },
            width: '100%',
            borderBottomWidth: 1,
            borderBottomColor: LIGHT_GREY,
          }}
          heading="Payment Info"
          headingRight={editLabel}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10, color: GREY }}
        >
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        </MaterialPanel>
      );
    }

    if (this.props.hasValidCC && !this.props.isUpdatingCard) {
      const displayCCNum = `•••• •••• •••• ${this.props.ccLastFour}`;
      const displayDate = `${this.props.ccExpMonth}/${this.props.ccExpYear}`;
      const cardIcon = this.renderCardIcon(this.props.ccType);

      paymentDisplay = (
        <CreditCardDisplay
          displayStyle={displayStyle}
          cardIcon={cardIcon}
          displayCCNum={displayCCNum}
          displayDate={displayDate}
        />
      );
    } else if (this.state.valid) {
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
    } else if (this.props.isUpdatingCard || this.props.userHasNoCard) {
      paymentDisplay = (
        <LiteCreditCardInput
          autoFocus
          cardScale={0.7}
          labels={{
            number: 'Card Number',
            expiry: 'Expiration',
            cvc: 'CVC',
          }}
          allowScroll
          labelStyle={{ paddingTop: 10, fontFamily: 'studio-font' }}
          validColor="black"
          invalidColor="red"
          placeholderColor="darkgray"
          onChange={this.onChange}
          inputStyle={{ fontFamily: 'studio-font' }}
        />
      );
    }

    return (
      <MaterialPanel
        height={displayHeight}
        style={{
          shadowOffset: { width: 3, height: 3 },
          width: '100%',
          borderBottomWidth: 1,
          borderBottomColor: LIGHT_GREY,
        }}
        heading="Payment Info"
        headingRight={editLabel}
        headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
        headerStyle={{ marginLeft: 10, color: GREY }}
        onPressHeadingRight={this.props.setEditCC}
      >
        <FadeInView>
          {paymentDisplay}
        </FadeInView>
      </MaterialPanel>
    );
  }
}

const numberLike = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
]).isRequired;

PaymentInfo.propTypes = {
  isUpdatingCard: PropTypes.bool.isRequired,
  setEditCC: PropTypes.func.isRequired,
  loadingCreditCard: PropTypes.bool.isRequired,
  ccLastFour: numberLike,
  ccExpMonth: numberLike,
  ccExpYear: numberLike,
  ccType: PropTypes.string.isRequired,
  hasValidCC: PropTypes.bool.isRequired,
  userHasNoCard: PropTypes.bool.isRequired,
  updateCreditCard: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
};

const mapStateToProps = state => ({
  loadingCreditCard: getCCIsLoading(state),
  ccLastFour: getCCLastFour(state),
  ccExpMonth: getCCExpMonth(state),
  ccExpYear: getCCExpYear(state),
  ccType: getCCType(state),
  hasValidCC: getCCIsValid(state),
  userHasNoCard: getIfHasNoCC(state),
});

const mapDispatchToProps = {
  updateCreditCard,
};

export default connect(mapStateToProps, mapDispatchToProps)(PaymentInfo);
