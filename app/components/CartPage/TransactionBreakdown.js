import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MaterialPanel from '../shared/MaterialPanel';
import { LIGHT_GREY } from '../../constants/ColorConstants';

import {
  getFormattedCartSubtotalWithPackageClasses,
  getCartPromoCodeAmount,
  getFormattedPromoCodeAmount,
  getCartPassesValue,
  getFormattedCartPassesValue,
  getCartTaxAmount,
  getFormattedCartTaxAmount,
  getCartStudioCreditsApplied,
  getFormattedCartStudioCreditsApplied,
  getCartRAFCreditApplied,
  getFormattedCartRAFCreditApplied,
  getCartGlobalCreditApplied,
  getFormattedCartGlobalCreditApplied,
  getFormattedCartTotal,
} from '../../selectors/CartSelectors/PurchaseBreakdown';

import {
  getUserFlashCreditAmount,
  getFormattedUserFlashCreditAmount,
} from '../../selectors/UserSelectors';

import BreakdownRow from './BreakdownRow';

const StyledBreakDownView = styled.View`
  margin: 10px;
  height: auto;
`;

const StyledLine = styled.View`
  margin-top: 20px;
  margin-bottom: 20px;
  border-width: 0.5px;
  border-color: ${LIGHT_GREY};
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class TransactionBreakdown extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <MaterialPanel
        heading="Order Summary"
        style={{ shadowOffset: { width: 3, height: 3 } }}
        headerStyle={{ marginLeft: 10 }}
      >
        <StyledBreakDownView>
          <BreakdownRow label="Subtotal" value={this.props.formattedSubtotal} />
          {this.props.promoCodeAmount > 0 && <BreakdownRow label="Promo Code" value={this.props.formattedPromoCodeAmount} />}
          {this.props.flashCreditAmount > 0 && <BreakdownRow label="Flash Credit" value={this.props.formattedFlashCreditAmount} />}
          {this.props.passValueAmount > 0 && <BreakdownRow label="Pass Value" value={this.props.formattedPassValueAmount} />}
          {this.props.taxAmount > 0 && <BreakdownRow label="Estimated Tax" value={this.props.formattedTaxAmount} />}
          {this.props.studioCreditAmount > 0 && <BreakdownRow label="Studio Credit" value={this.props.formattedStudioCreditAmount} />}
          {this.props.rafCreditAmount > 0 && <BreakdownRow label="Refer a Friend Credit" value={this.props.formattedRAFCreditAmount} />}
          {this.props.globalCreditAmount > 0 && <BreakdownRow label="Global Credit" value={this.props.formattedGlobalCreditAmount} />}
          <StyledLine />
          <BreakdownRow
            label="Total"
            labelStyle={{ fontFamily: 'flex-font-heavy' }}
            value={this.props.formattedTotal}
            valueStyle={{ fontFamily: 'flex-font-heavy', fontSize: 18 }}
          />
        </StyledBreakDownView>
      </MaterialPanel>
    );
  }
}

TransactionBreakdown.propTypes = {
  formattedSubtotal: PropTypes.string.isRequired,
  formattedTotal: PropTypes.string.isRequired,
  promoCodeAmount: PropTypes.number.isRequired,
  formattedPromoCodeAmount: PropTypes.string.isRequired,
  flashCreditAmount: PropTypes.number.isRequired,
  formattedFlashCreditAmount: PropTypes.string.isRequired,
  passValueAmount: PropTypes.number.isRequired,
  formattedPassValueAmount: PropTypes.string.isRequired,
  studioCreditAmount: PropTypes.number.isRequired,
  formattedStudioCreditAmount: PropTypes.string.isRequired,
  rafCreditAmount: PropTypes.number.isRequired,
  formattedRAFCreditAmount: PropTypes.string.isRequired,
  globalCreditAmount: PropTypes.number.isRequired,
  formattedGlobalCreditAmount: PropTypes.string.isRequired,
  taxAmount: PropTypes.number.isRequired,
  formattedTaxAmount: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  formattedSubtotal: getFormattedCartSubtotalWithPackageClasses(state),
  promoCodeAmount: getCartPromoCodeAmount(state),
  formattedPromoCodeAmount: getFormattedPromoCodeAmount(state),
  flashCreditAmount: getUserFlashCreditAmount(state),
  formattedFlashCreditAmount: getFormattedUserFlashCreditAmount(state),
  passValueAmount: getCartPassesValue(state),
  formattedPassValueAmount: getFormattedCartPassesValue(state),
  taxAmount: getCartTaxAmount(state),
  formattedTaxAmount: getFormattedCartTaxAmount(state),
  studioCreditAmount: getCartStudioCreditsApplied(state),
  formattedStudioCreditAmount: getFormattedCartStudioCreditsApplied(state),
  rafCreditAmount: getCartRAFCreditApplied(state),
  formattedRAFCreditAmount: getFormattedCartRAFCreditApplied(state),
  globalCreditAmount: getCartGlobalCreditApplied(state),
  formattedGlobalCreditAmount: getFormattedCartGlobalCreditApplied(state),
  formattedTotal: getFormattedCartTotal(state),
});

export default connect(mapStateToProps)(TransactionBreakdown);
