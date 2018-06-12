import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { View, Text } from 'react-native';
import { withNavigation, NavigationActions } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import FadeInView from '../shared/FadeInView';
import {
  getFormattedCartValueBack,
  getConfirmationState,
  getCartValueBack,
  getFormattedCartTotal,
  getCartIsPurchasing,
  getDetailedCartEvents,
  getCCExpMonth,
  getCCIsLoading,
} from '../../selectors';
import { submitCartForPurchase, clearPromoCodeData } from '../../actions';
import {
  LIGHT_GREY,
  WHITE,
  BLACK,
  RECEIPT_ROUTE,
  GREY,
} from '../../constants';

import {
  LinearLoader,
  PaymentInfo,
  EventListItem,
  SwipableButton,
} from '../shared';
import CartTransaction from './CartTransaction';
import PromoField from './PromoField';
import Config from '../../../config.json';
import NoItems from './NoItems';
import Header from '../Header';

import { NormalText, FlexCenter } from '../styled';

const Container = styled.ScrollView`
  flex: 1;
`;

const CheckoutView = styled.View`
  justify-content: space-between;
  align-items: center;
  border-top-width: 1;
  border-color: ${LIGHT_GREY};
  elevation: 3;
  background-color: ${WHITE};
  shadow-color: ${BLACK};
  shadow-opacity: 0.02;
  elevation: 3;
`;

const SavingsText = NormalText.extend`
  color: ${BLACK};
`;

/**
 * @class CartPage
 * @extends {Component}
 */
class CartPage extends PureComponent {
  /**
   * @static
   * @param {Object} props to test
   * @param {Object} state to test
   * @returns {boolean} if ready for purchase
   */
  static getIsReadyForPurchase(props, state) {
    return props.creditCardExpMonth && (!props.creditCardLoading) && (!state.isUpdatingCard);
  }
  /**
   * @constructor
   * @constructs CartPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      isUpdatingCard: false,
      isProcessingPayment: false,
    };
    this.toPreviousPage = this.toPreviousPage.bind(this);
    this.setEditCC = this.setEditCC.bind(this);
    this.handlePurchase = this.handlePurchase.bind(this);
  }
  /**
   * @param {Object} props previous props
   * @param {Object} state previous state
   * @returns {undefined}
   */
  componentDidUpdate(props) {
    if (!this.props.cart.length) {
      this.props.clearPromoCodeData();
    }

    if (this.props.confirmedPurchases.length) {
      this.props.navigation.navigate(RECEIPT_ROUTE);
    } else if (props.purchasing && !this.props.purchasing) {
      this.endPurchase();
    }
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.swipeAnimInterval) clearInterval(this.swipeAnimInterval);
  }
  /**
   * @param {bool} bool the state of the editing
   * @returns {undefined}
   */
  setEditCC() {
    this.setState({
      isUpdatingCard: !this.state.isUpdatingCard,
    });
  }
   /**
   * @returns {undefined}
   */
  handlePurchase() {
    this.setState({ isProcessingPayment: true });
    this.props.submitCartForPurchase();
  }
  /**
   * @returns {undefined}
   */
  endPurchase() {
    this.setState({ isProcessingPayment: false });
  }

  /**
   * @returns {undefined}
   */
  toPreviousPage() {
    let previousRoute = this.props.navigation.state.params && this.props.navigation.state.params.previousRoute;

    if (!previousRoute) {
      const navigateAction = NavigationActions.navigate({
        routeName: 'DrawerOpen',
      });

      this.props.navigation.dispatch(navigateAction);
      return;
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
    const renderValueBackMessage = this.props.valueBack > 0 ?
      `Book now to earn ${this.props.formattedValueBack} in credit back`
      : `Book now for ${this.props.formattedCartTotal}`;

    const notReadyForPurchase = !CartPage.getIsReadyForPurchase(this.props, this.state);

    const renderPurchaseButton = (
      <SwipableButton
        swipeText="Swipe to pay"
        notReadyForPurchase={notReadyForPurchase}
        onLeftButtonsActivate={this.handlePurchase}
      />
    );

    if (this.state.isProcessingPayment) {
      return (
        <FadeInView style={{ backgroundColor: Config.STUDIO_COLOR }}>
          <FlexCenter>
            <LinearLoader showQuote />
          </FlexCenter>
        </FadeInView>
      );
    }

    if (!this.props.cart.length) {
      return <NoItems />;
    }

    return (
      <FadeInView style={{ backgroundColor: WHITE }}>
        <Header title="My Cart" showCart={false} />
        <Container>
          <View>
            <View style={{ marginLeft: 20, marginTop: 20 }}>
              <Text style={{ fontSize: 16, color: GREY, fontFamily: 'studio-font-heavy' }}>Items</Text>
            </View>
            {this.props.cart.map(item => (
              <EventListItem
                key={item.eventid}
                isCartEvent
                {...item}
              />
            ))}
          </View>
          <PaymentInfo
            isUpdatingCard={this.state.isUpdatingCard}
            setEditCC={this.setEditCC}
          />
          <PromoField />
          <CartTransaction />
        </Container>
        <CheckoutView>
          <View style={{ justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 15 }}>
            <SavingsText>
              {renderValueBackMessage}
            </SavingsText>
          </View>
          {renderPurchaseButton}
        </CheckoutView>
      </FadeInView>
    );
  }
}

CartPage.propTypes = {
  navigation: PropTypes.shape().isRequired,
  cart: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  formattedValueBack: PropTypes.string.isRequired,
  valueBack: PropTypes.number.isRequired,
  formattedCartTotal: PropTypes.string.isRequired,
  submitCartForPurchase: PropTypes.func,
  confirmedPurchases: PropTypes.arrayOf(PropTypes.shape()),
  purchasing: PropTypes.bool.isRequired,
  clearPromoCodeData: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  cart: getDetailedCartEvents(state),
  formattedValueBack: getFormattedCartValueBack(state),
  valueBack: getCartValueBack(state),
  formattedCartTotal: getFormattedCartTotal(state),
  confirmedPurchases: getConfirmationState(state),
  purchasing: getCartIsPurchasing(state),
  creditCardExpMonth: getCCExpMonth(state),
  creditCardLoading: getCCIsLoading(state),
});

const mapDispatchToProps = {
  submitCartForPurchase,
  clearPromoCodeData,
};

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(CartPage));
