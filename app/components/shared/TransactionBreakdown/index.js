import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { MaterialPanel } from '../../shared';
import { LIGHT_GREY } from '../../../constants/ColorConstants';

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
        heading={this.props.forReceiptPage ? 'Order Summary' : this.props.name}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        headerStyle={{ marginLeft: 10 }}
      >
        <StyledBreakDownView>
          {Boolean(this.props.name) && this.props.forReceiptPage &&
            <BreakdownRow
              label="Name"
              value={this.props.name}
              dots={false}
            />
          }

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
          <StyledLine />
          <BreakdownRow
            label="Total"
            labelStyle={{ fontFamily: 'flex-font-heavy' }}
            value={this.props.formattedTotal}
            valueStyle={{ fontFamily: 'flex-font-heavy', fontSize: 18 }}
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
  name: PropTypes.string,
  forReceiptPage: PropTypes.bool,
};

export default TransactionBreakdown;
