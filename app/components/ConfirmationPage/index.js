import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Text, ActivityIndicator } from 'react-native';
import { withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';
import Swipeable from 'react-native-swipeable';
import styled from 'styled-components';
import FadeInView from '../shared/FadeInView';
import { getSortedCartEvents } from '../../selectors/CartSelectors';
import { LIGHT_GREY, SOFT_GREY, BLACK, GREY } from '../../constants';
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
import CartItem from '../CartPage/CartItem';
import TransactionBreakdown from '../CartPage/TransactionBreakdown';
import PaymentInfo from './PaymentInfo';
import { MaterialPanelView } from '../styled';

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
  height: 100px;
  margin: 6px;
  background-color: ${SOFT_GREY};
`;

const StyledContinueButton = styled.TouchableOpacity`
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: ${props => props.hasDisabledColor ? GREY : Config.STUDIO_COLOR};
  border-radius: 5px;
  border-width: 1px;
  border-color: ${props => props.hasDisabledColor ? GREY : Config.STUDIO_COLOR};;
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
class ConfirmationPage extends Component {
  /**
   * @constructor
   * @constructs CartPage
   */
  constructor() {
    super();

    this.state = {
      isLoading: false,
      isProcessingPayment: false,
    };

    this.toPreviousPage = this.toPreviousPage.bind(this);
    this.setLoading = this.setLoading.bind(this);
  }

  /**
   * @param {bool} bool the state of the loading
   * @returns {undefined}
   */
  setLoading(bool) {
    this.setState({
      isLoading: bool,
    });
  }

    /**
   * @returns {undefined}
   */
  toPreviousPage() {
    this.props.navigation.navigate('Cart');
  }


  /**
   * @returns {JSX} XML
   */
  render() {
    const purchaseButton = [
      <StyledContinueButton />,
    ];

    const renderCartItems = this.props.cart.map(cart =>
        (<CartItem
          key={cart.eventid}
          eventid={cart.eventid}
          name={cart.name}
          quantity={cart.quantity}
          startTime={cart.startTime}
          price={cart.price}
        />)
      );

    const renderPurchaseButton = (<View style={{ width: 390, overflow: 'hidden', backgroundColor: Config.STUDIO_COLOR, borderRadius: 5 }}>
      <Swipeable
        contentContainerStyle={
        { backgroundColor: (!(this.props.creditCard.expMonth) || this.state.isLoading) ? GREY : Config.STUDIO_COLOR,
          paddingLeft: 100,
          paddingRight: 100,
          paddingTop: 15,
          paddingBottom: 15,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: (!(this.props.creditCard.expMonth) || this.state.isLoading) ? GREY : Config.STUDIO_COLOR,
        }}
        rightButtons={purchaseButton}
        onRightButtonsActivate={() => this.setState({ isProcessingPayment: true })}
        rightButtonsActivationDistance={300}
      >
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: 'white' }}>{'<<'}</Text>
          <Text style={{ textAlign: 'center', color: 'white', flex: 1 }}>Swipe to pay</Text>
        </View>
      </Swipeable>
    </View>);

    return (
      <FadeInView style={{ backgroundColor: SOFT_GREY }}>
        <StyledTopView style={{ marginBottom: -10 }}>
          <Icon
            iconName="arrow-left"
            iconColor={BLACK}
            onPress={this.toPreviousPage}
            style={{ position: 'absolute', left: 0, fontSize: 11 }}
          />
          <StyledCenterText>
            Confirm Checkout
          </StyledCenterText>
        </StyledTopView>
        <StyledScrollView style={{ marginTop: 0 }}>
          <TransactionBreakdown
            formattedSubtotal={this.props.formattedSubtotal}
            formattedTaxAmount={this.props.formattedTaxAmount}
            formattedTotal={this.props.formattedTotal}
          />
          <PaymentInfo isLoading={this.state.isLoading} setLoading={this.setLoading} />
          <MaterialPanelView style={{ shadowOffset: { width: 3, height: 3 } }}>
            {renderCartItems}
          </MaterialPanelView>
        </StyledScrollView>
        <StyledCheckoutView>
          {this.state.isProcessingPayment ? <ActivityIndicator /> : renderPurchaseButton}
        </StyledCheckoutView>
      </FadeInView>
    );
  }
}

ConfirmationPage.propTypes = {
  navigation: PropTypes.shape(),
  creditCard: PropTypes.shape(),
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
  creditCard: state.creditCard,
});

export default withNavigation(connect(mapStateToProps)(ConfirmationPage));
