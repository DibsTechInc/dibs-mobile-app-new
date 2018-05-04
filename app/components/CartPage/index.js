import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import { withNavigation, NavigationActions } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import FadeInView from '../shared/FadeInView';
import { FlexRow } from '../styled/Views';
import { getSortedCartEvents } from '../../selectors/CartSelectors';
import { WHITE, LIGHT_GREY, SOFT_GREY, BLACK } from '../../constants';
import Icon from '../shared/Icon';

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
import PromoField from './PromoField';

import { MaterialPanelView } from '../styled';
import {
  SCHEDULE_ROUTE,
  CONFIRMATION_ROUTE,
} from '../../constants/RouteConstants';

import MaterialButton from '../shared/MaterialButton';

const StyledScrollView = styled.ScrollView`
  flex: 1;
`;

const StyledTopView = styled.View`
  flex-direction: row;
  position: relative;
  backgroundColor: #fff;
  border-width: 1px;
  border-top-color: #fff;
  border-left-color: #fff;
  border-right-color: #fff;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border-bottom-width: 1px;
  border-bottom-color: ${LIGHT_GREY};
  margin-top: 30px;
  margin-left: 10px;
  margin-right: 10px;
  height: 50;
  justify-content: center;
  align-items: center;
`;

const StyledCheckoutView = styled.View`
  justify-content: center;
  align-items: center;
  height: 150px;
  margin: 6px;
  background-color: ${SOFT_GREY};
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16px;
`;

const StyledSavingsText = StyledText.extend`
  color: ${BLACK};
`;

const StyledCenterText = styled.Text`
  font-family: 'flex-font-heavy';
  text-align: center;
  font-size: 16px;
`;

/**
 * @class CartPage
 * @extends {Component}
 */
class CartPage extends Component {
  /**
   * @constructor
   * @constructs CartPage
   */
  constructor() {
    super();

    this.toPreviousPage = this.toPreviousPage.bind(this);
  }

  /**
   * @returns {undefined}
   */
  toPreviousPage() {
    let previousRoute = this.props.navigation.state.params && this.props.navigation.state.params.previousRoute;
    // console.log(previousRoute, 'what this')

    if (!previousRoute) {
      const navigateAction = NavigationActions.navigate({
        routeName: 'DrawerOpen',
      });

      return this.props.navigation.dispatch(navigateAction);
    }

    const keyType = this.props.navigation.state.key.split('-')[0];
    const previousRouteKeyType = previousRoute.split('-')[0];

    if (previousRouteKeyType === 'id') {
      previousRoute = 'DrawerOpen';
    }

    if (keyType === 'id') {
      previousRoute = 'Main';
    }

    const navigateAction = NavigationActions.navigate({
      routeName: previousRoute,
    });

    this.props.navigation.dispatch(navigateAction);
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    let renderCartItems = <CartItem hasEmptyCart />;

    if (!this.props.cart.length) {
      return (
        <FadeInView>
          <StyledTopView>
            <Icon
              iconName="user-circle"
              iconColor={BLACK}
              onPress={this.toPreviousPage}
              style={{ position: 'absolute', left: 0, fontSize: 11 }}
            />
            <StyledCenterText>
              My Cart
            </StyledCenterText>
          </StyledTopView>
          <StyledScrollView>
            <MaterialPanelView style={{ shadowOffset: { width: 3, height: 3 } }}>
              {renderCartItems}
            </MaterialPanelView>
          </StyledScrollView>
          <StyledCheckoutView>
            <FlexRow>
              <MaterialButton
                text="Class Schedule"
                onPress={() => { this.props.navigation.navigate(SCHEDULE_ROUTE); }}
                style={{ flex: 1, height: 50 }}
              />
            </FlexRow>
          </StyledCheckoutView>
        </FadeInView>
      );
    }

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
      <FadeInView style={{ backgroundColor: SOFT_GREY }}>
        <StyledTopView>
          <Icon
            iconName="arrow-left"
            iconColor={BLACK}
            onPress={this.toPreviousPage}
            style={{ position: 'absolute', left: 0, fontSize: 11 }}
          />
          <StyledCenterText>
            My Cart
          </StyledCenterText>
        </StyledTopView>
        <StyledScrollView>
          <MaterialPanelView style={{ shadowOffset: { width: 3, height: 3 }, marginTop: 0 }}>
            {renderCartItems}
          </MaterialPanelView>
          <PromoField />
          <TransactionBreakdown
            formattedSubtotal={this.props.formattedSubtotal}
            formattedTaxAmount={this.props.formattedTaxAmount}
            formattedTotal={this.props.formattedTotal}
          />
        </StyledScrollView>
        <StyledCheckoutView>
          <View style={{ marginBottom: 30 }}>
            <StyledSavingsText>Place order to earn $1.09 in credit back.</StyledSavingsText>
          </View>
          <FlexRow>
            <MaterialButton
              text="Checkout"
              onPress={() => { this.props.navigation.navigate(CONFIRMATION_ROUTE); }}
              style={{ flex: 1, height: 50 }}
            />
          </FlexRow>
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

export default withNavigation(connect(mapStateToProps)(CartPage));
