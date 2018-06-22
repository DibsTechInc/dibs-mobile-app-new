import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { MaterialPanel } from '../../shared';
import { GREY } from '../../../constants/ColorConstants';

import BreakdownRow from './BreakdownRow';

const StyledBreakDownView = styled.View`
  margin: 10px;
  margin-bottom: 0;
  height: auto;
  width: 100%;
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
        style={{ shadowOffset: { width: 3, height: 3 }, width: '100%' }}
        headerStyle={{ marginLeft: 10, color: GREY }}
      >
        <StyledBreakDownView>
          <BreakdownRow label="Subtotal" value={this.props.formattedSubtotal} />

          {this.props.promoCodeAmount > 0 &&
            <BreakdownRow label="Promo Code" value={this.props.formattedPromoCodeAmount} />}

          {this.props.flashCreditAmount > 0 &&
            <BreakdownRow label="Flash Credit" value={this.props.formattedFlashCreditAmount} />}

          {this.props.passValueAmount > 0 &&
            <BreakdownRow label="Pass Value" value={this.props.formattedPassValueAmount} />}

          {this.props.taxAmount > 0 &&
            <BreakdownRow label="Estimated Tax" value={this.props.formattedTaxAmount} />}

          {this.props.studioCreditAmount > 0 &&
            <BreakdownRow label="Studio Credit" value={this.props.formattedStudioCreditAmount} />}

          {this.props.rafCreditAmount > 0 &&
            <BreakdownRow label="Refer a Friend Credit" value={this.props.formattedRAFCreditAmount} />}

          {this.props.globalCreditAmount > 0 &&
            <BreakdownRow label="Global Credit" value={this.props.formattedGlobalCreditAmount} />}

          {this.props.discountAmount > 0 &&
            <BreakdownRow label="Discount Amount" value={this.props.formattedDiscountAmount} />}

          <BreakdownRow
            label="Total"
            labelStyle={{ fontFamily: 'studio-font-heavy' }}
            value={this.props.formattedTotal}
            valueStyle={{ fontFamily: 'studio-font-heavy', fontSize: 18 }}
            dots={false}
          />
        </StyledBreakDownView>
      </MaterialPanel>
    );
  }
}

TransactionBreakdown.defaultProps = { forReceiptPage: true };

TransactionBreakdown.propTypes = {
  formattedSubtotal: PropTypes.string,
  formattedTotal: PropTypes.string,
  promoCodeAmount: PropTypes.number,
  formattedPromoCodeAmount: PropTypes.string,
  flashCreditAmount: PropTypes.number,
  formattedFlashCreditAmount: PropTypes.string,
  passValueAmount: PropTypes.number,
  formattedPassValueAmount: PropTypes.string,
  studioCreditAmount: PropTypes.number,
  formattedStudioCreditAmount: PropTypes.string,
  rafCreditAmount: PropTypes.number,
  formattedRAFCreditAmount: PropTypes.string,
  globalCreditAmount: PropTypes.number,
  formattedGlobalCreditAmount: PropTypes.string,
  taxAmount: PropTypes.number,
  formattedTaxAmount: PropTypes.string,
  discountAmount: PropTypes.number,
  formattedDiscountAmount: PropTypes.string,
};

export default TransactionBreakdown;
