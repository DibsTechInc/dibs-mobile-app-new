import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { View, Animated } from 'react-native';
import { withNavigation, NavigationActions } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Swipeable from 'react-native-swipeable';
import { isIphoneX } from 'react-native-iphone-x-helper';

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
import { submitCartForPurchase } from '../../actions';
import {
  LIGHT_GREY,
  GREY,
  WHITE,
  BLACK,
  RECEIPT_ROUTE,
  WIDTH,
} from '../../constants';

import {
  LinearLoader,
  PaymentInfo,
  EventListItem,
} from '../shared';
import CartTransaction from './CartTransaction';
import PromoField from './PromoField';
import Config from '../../../config.json';
import NoItems from './NoItems';
import Header from '../Header';

import { NormalText, FlexCenter, HeavyText } from '../styled';

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

const SwipeText = HeavyText.extend`
  text-align: center;
  color: ${WHITE};
  flex: 1;
`;

const SavingsText = NormalText.extend`
  color: ${BLACK};
`;

const ContinueButton = styled.TouchableOpacity`
  padding-right: 10px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: ${props => (props.hasDisabledColor ? GREY : Config.STUDIO_COLOR)};
  border-width: 1px;
  border-color: ${props => (props.hasDisabledColor ? GREY : Config.STUDIO_COLOR)};;
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
      animValue: new Animated.Value(0),
    };
    this.toPreviousPage = this.toPreviousPage.bind(this);
    this.setEditCC = this.setEditCC.bind(this);
    this.handlePurchase = this.handlePurchase.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    if (CartPage.getIsReadyForPurchase(this.props, this.state)) {
      this.animateSwipe();
    }
    this.resetAnimInterval(false);
  }
  /**
   * @param {Object} props previous props
   * @param {Object} state previous state
   * @returns {undefined}
   */
  componentDidUpdate(props) {
    this.resetAnimInterval();
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
  animateSwipe() {
    Animated.sequence([
      Animated.timing(
        this.state.animValue,
        { toValue: 1, duration: 2e3 }
      ),
      Animated.timing(
        this.state.animValue,
        { toValue: 0, duration: 0 }
      ),
    ]).start();
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
   * @param {boolean} resetAnimation if true resets swipe animation
   * @returns {undefined}
   */
  resetAnimInterval(resetAnimation = true) {
    if (this.swipeAnimInterval) {
      clearInterval(this.swipeAnimInterval);
      this.swipeAnimInterval = null;
    }
    if (resetAnimation) Animated.timing(this.state.animValue, { toValue: 0, duration: 0 }).start();
    this.swipeAnimInterval = setInterval(() => {
      if (CartPage.getIsReadyForPurchase(this.props, this.state)) this.animateSwipe();
    }, 6e3);
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
      `Place your order to earn ${this.props.formattedValueBack} in credit back`
      : `Place your order for ${this.props.formattedCartTotal}`;

    const purchaseButton = [
      <ContinueButton />,
    ];

    const notReadyForPurchase = !CartPage.getIsReadyForPurchase(this.props, this.state);
    const renderButtonColor = notReadyForPurchase ? LIGHT_GREY : Config.STUDIO_COLOR;
    const renderLeftButtons = notReadyForPurchase ? null : purchaseButton;

    const renderPurchaseButton = (
      <View style={{ overflow: 'hidden', backgroundColor: Config.STUDIO_COLOR, width: WIDTH }}>
        <Swipeable
          contentContainerStyle={{
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: renderButtonColor,
            height: 45,
            marginBottom: Number(isIphoneX()) && 45,
            borderWidth: 1,
            borderColor: renderButtonColor,
            overflow: 'hidden',
          }}
          leftButtons={renderLeftButtons}
          onLeftButtonsActivate={this.handlePurchase}
          leftButtonsActivationDistance={150}
        >
          <SwipeText>
            Swipe to pay
          </SwipeText>
          <Animated.View
            style={{
              backgroundColor: WHITE,
              opacity: 0.18,
              position: 'absolute',
              height: 70,
              width: 30,
              top: -10,
              transform: [{ rotate: '20deg' }],
              left: Animated.add(-0.5 * WIDTH, Animated.multiply(2 * WIDTH, this.state.animValue)),
            }}
            pointerEvents="none"
          />
        </Swipeable>
      </View>
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
          {this.props.cart.map(item => (
            <EventListItem
              key={item.eventid}
              isCartEvent
              {...item}
            />
          ))}
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
};

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(CartPage));
