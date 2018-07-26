import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getAppliedPromoCode, getPromoCodeIsSubmitting, getPromoCodeError, getPromoCodeNotice } from '../../selectors';
import { verifyPromoCode, clearPromoCodeError, clearPromoCodeNotice, clearPromoCode } from '../../actions';
import {
  PROMO_PRODUCT_PACKAGE,
  PROMO_PRODUCT_CLASS,
} from '../../constants';

import { SpecialField } from '../shared';

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PromoField extends PureComponent {
  /**
   * @constructor
   * @constructs PromoField
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { promoCode: '' };
    this.handlePromoCodeChange = this.handlePromoCodeChange.bind(this);
    this.handlePress = this.handlePress.bind(this);
  }
  /**
   * @param {Object} props component will receive
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (!this.props.errorMessage && props.errorMessage) {
      if (this.clearErrorTimer) clearTimeout(this.clearErrorTimer);
      this.clearErrorTimer = setTimeout(() => {
        this.props.clearPromoCodeError();
        this.clearErrorTimer = null;
      }, 5e3);
    }
    if (!this.props.noticeMessage && props.noticeMessage) {
      if (this.clearNoticeTimer) clearTimeout(this.clearNoticeTimer);
      this.clearNoticeTimer = setTimeout(() => {
        this.props.clearPromoCodeNotice();
        this.clearNoticeTimer = null;
      }, 5e3);
    }
  }
  /**
   * @param {string} value in input
   * @returns {undefined}
   */
  handlePromoCodeChange(value) {
    this.setState({ promoCode: value.toUpperCase() });
  }
  /**
   * @returns {undefined}
   */
  handlePress() {
    const promoCodeType = this.props.packages.length ? PROMO_PRODUCT_PACKAGE : PROMO_PRODUCT_CLASS;

    return this.props.currentPromoCode ?
      this.setState({ promoCode: '' }, () => this.props.clearPromoCode()) :
      this.props.verifyPromoCode(this.state.promoCode, promoCodeType);
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <SpecialField
        inputStateItem={this.state.promoCode}
        handlePress={this.handlePress}
        handleChange={this.handlePromoCodeChange}
        heading="Promo Code"
        buttonText="Apply"
        {...this.props}
      />
    );
  }
}

PromoField.propTypes = {
  currentPromoCode: PropTypes.string.isRequired,
  errorMessage: PropTypes.string.isRequired,
  noticeMessage: PropTypes.string.isRequired,
  verifyPromoCode: PropTypes.func.isRequired,
  clearPromoCodeError: PropTypes.func.isRequired,
  clearPromoCodeNotice: PropTypes.func.isRequired,
  clearPromoCode: PropTypes.func.isRequired,
  packages: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  currentPromoCode: getAppliedPromoCode(state),
  submitting: getPromoCodeIsSubmitting(state),
  errorMessage: getPromoCodeError(state),
  noticeMessage: getPromoCodeNotice(state),
});
const mapDispatchToProps = {
  verifyPromoCode,
  clearPromoCodeError,
  clearPromoCodeNotice,
  clearPromoCode,
};

export default connect(mapStateToProps, mapDispatchToProps)(PromoField);
