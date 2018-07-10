import { connect } from 'react-redux';
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
  getFormattedCartTotal,
  getCartFlashCreditAmount,
  getFormattedCartFlashCreditAmount,
} from '../../selectors';
import { TransactionBreakdown } from '../shared';

const mapStateToProps = state => ({
  formattedSubtotal: getFormattedCartSubtotalWithPackageClasses(state),
  promoCodeAmount: getCartPromoCodeAmount(state),
  formattedPromoCodeAmount: getFormattedPromoCodeAmount(state),
  flashCreditAmount: getCartFlashCreditAmount(state),
  formattedFlashCreditAmount: getFormattedCartFlashCreditAmount(state),
  passValueAmount: getCartPassesValue(state),
  formattedPassValueAmount: getFormattedCartPassesValue(state),
  taxAmount: getCartTaxAmount(state),
  formattedTaxAmount: getFormattedCartTaxAmount(state),
  studioCreditAmount: getCartStudioCreditsApplied(state),
  formattedStudioCreditAmount: getFormattedCartStudioCreditsApplied(state),
  rafCreditAmount: getCartRAFCreditApplied(state),
  formattedRAFCreditAmount: getFormattedCartRAFCreditApplied(state),
  formattedTotal: getFormattedCartTotal(state),
});

export default connect(mapStateToProps)(TransactionBreakdown);
