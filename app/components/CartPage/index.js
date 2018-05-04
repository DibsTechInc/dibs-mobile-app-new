import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dimensions, View } from 'react-native';
import { withNavigation, NavigationActions } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import FadeInView from '../shared/FadeInView';
import { getSortedCartEvents } from '../../selectors/CartSelectors';
import { WHITE, LIGHT_GREY, SOFT_GREY, BLACK } from '../../constants';
import Config from '../../../config.json';
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
import PaymentInfo from './PaymentInfo';
import PromoField from './PromoField';

const WIDTH = Dimensions.get('window').width - 20;

const StyledScrollView = styled.ScrollView`
  flex: 1;
`;

const StyledSectionViewOne = styled.View`
  background-color: ${WHITE};
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  height: ${props => props.height ? props.height : 'auto'};
  width: ${WIDTH};
  margin-left: 10px;
  margin-right: 10px;
  margin-bottom: 10px;
  border-width: 0.3;
  border-color: #ddd;
  border-top-width: 0;
  border-left-width: 0;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 4;
  elevation: 3;
`;

const StyledSectionViewTwo = StyledSectionViewOne.extend`
  border-radius: 3px;
  margin: 10px;
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

const StyledContinueButton = styled.TouchableOpacity`
  padding-left: 100px;
  padding-right: 100px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: ${Config.STUDIO_COLOR};
  border-radius: 5px;
  border-width: 1px;
  border-color: ${Config.STUDIO_COLOR};
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
  font-size: 16px;
`;

const StyledButtonText = StyledText.extend`
  color: #fff;
`;

const StyledSavingsText = StyledText.extend`
  color: #000;
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
    const keyType = this.props.navigation.state.key.split('-')[0];

    if (keyType === 'id') {
      previousRoute = 'MAIN_ROUTE';
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
          <StyledCenterText>My Cart</StyledCenterText>
        </StyledTopView>
        <StyledScrollView >
          <StyledSectionViewOne style={{ shadowOffset: { width: 3, height: 3 } }}>
            {renderCartItems}
          </StyledSectionViewOne>
          <StyledSectionViewTwo height={'150'} style={{ shadowOffset: { width: 3, height: 3 } }}>
            <PromoField />
          </StyledSectionViewTwo>
          <StyledSectionViewTwo height={'280'} style={{ shadowOffset: { width: 3, height: 3 } }}>
            <PaymentInfo />
          </StyledSectionViewTwo>
          <StyledSectionViewTwo>
            <TransactionBreakdown
              formattedSubtotal={this.props.formattedSubtotal}
              formattedTaxAmount={this.props.formattedTaxAmount}
              formattedTotal={this.props.formattedTotal}
            />
          </StyledSectionViewTwo>
        </StyledScrollView>
        <StyledCheckoutView>
          <View style={{ marginBottom: 30 }}>
            <StyledSavingsText>Place order to earn $1.09 in credit back.</StyledSavingsText>
          </View>
          <StyledContinueButton>
            <StyledButtonText>Checkout</StyledButtonText>
          </StyledContinueButton>
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
