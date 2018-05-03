import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dimensions, Text } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import FadeInView from '../shared/FadeInView';
import Header from '../Header';
import { getSortedCartEvents } from '../../selectors/CartSelectors';
import { WHITE, TEXT_GREY, LIGHT_GREY, GREEN, GREY } from '../../constants';
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
  getCartValueBack,
  getFormattedCartValueBack,
} from '../../selectors/CartSelectors/PurchaseBreakdown';
import {
  getUserFlashCreditAmount,
  getFormattedUserFlashCreditAmount,
} from '../../selectors/UserSelectors';
import CartItem from './CartItem';
import TransactionBreakdown from './TransactionBreakdown';
import PaymentInfo from './PaymentInfo';
import PromoField from './PromoField';

const WIDTH = Dimensions.get('window').width - 12;

const StyledScrollView = styled.ScrollView`
  flex: 1;
`;

const StyledSectionView = styled.View`
  background-color: #fff;
  border-width: 1px;
  border-color: #fff;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  height: ${props => props.height ? props.height : 'auto'};
  width: ${WIDTH};
  overflow: hidden;
  margin-left: 6px;
  margin-right: 6px;
  margin-bottom: 6px;
`;

const StyledTopView = styled.View`
  backgroundColor: #fff;
  border-width: 1px;
  border-top-color: #fff;
  border-left-color: #fff;
  border-right-color: #fff;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  border-bottom-width: 1px;
  border-bottom-color: ${LIGHT_GREY};
  margin-left: 6px;
  margin-right: 6px;
  height: 50;
  justify-content: center;
  align-items: center;
`;

const StyledCheckoutView = styled.View`
  justify-content: center;
  align-items: center;
  height: 150px;
  margin: 6px;
  background-color: #454545;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
`;

const StyledCenterText = styled.Text`
  font-family: 'flex-font-heavy';
  text-align: center;
`;

/**
 * @class CartPage
 * @extends {Component}
 */
class CartPage extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    let renderCartItems = <CartItem hasEmptyCart />;

    if (this.props.cart.length) {
      renderCartItems = this.props.cart.map(cart =>
        (<CartItem
          key={cart.eventid}
          eventid={cart.eventid}
          name={cart.name}
          quantity={cart.quantity}
          startTime={cart.startTime}
          price={cart.price}
        />)
      );
    }

    return (
      <FadeInView style={{ backgroundColor: '#454545' }} >
        <Header
          navigation={this.props.navigation}
          iconColor={'#000'}
          backgroundColor={'#454545'}
          showCart={false}
        />
        <StyledTopView>
          <StyledCenterText>My Cart</StyledCenterText>
        </StyledTopView>
        <StyledScrollView>
          <StyledSectionView>
            {renderCartItems}
          </StyledSectionView>
          <StyledSectionView height={'150'}>
            <PromoField />
          </StyledSectionView>
          <StyledSectionView height={'200'}>
            <PaymentInfo />
          </StyledSectionView>
          <StyledSectionView>
            <TransactionBreakdown
              formattedSubtotal={this.props.formattedSubtotal}
              formattedTaxAmount={this.props.formattedTaxAmount}
              formattedTotal={this.props.formattedTotal}
            />
          </StyledSectionView>
        </StyledScrollView>
        <StyledCheckoutView>
          <StyledText>Checkout box button</StyledText>
        </StyledCheckoutView>
      </FadeInView>
    );
  }
}

CartPage.propTypes = {
  navigation: PropTypes.shape(),
  cart: PropTypes.arrayOf(PropTypes.shape()),
  formattedSubtotal: PropTypes.string,
  formattedTaxAmount: PropTypes.string,
  formattedTotal: PropTypes.string,
};

const mapStateToProps = state => ({
  cart: getSortedCartEvents(state),
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
  valueBack: getCartValueBack(state),
  formattedValueBack: getFormattedCartValueBack(state),
});

export default connect(mapStateToProps)(CartPage);
