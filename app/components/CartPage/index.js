import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
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
} from '../../selectors';
import { submitCartForPurchase } from '../../actions';
import {
  SOFT_GREY,
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

import { NormalText } from '../styled';

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
`;

const SwipeText = NormalText.extend`
  text-align: center;
  color: ${WHITE};
  flex: 1;
`;

const SwipeArrows = NormalText.extend`
  color: ${WHITE};
  position: absolute;
  right: 40px;
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
   * @returns {undefined}
   */
  componentDidUpdate(props) {
    if (this.props.confirmedPurchases.length) {
      this.props.navigation.navigate(RECEIPT_ROUTE);
    } else if (props.purchasing && !this.props.purchasing) {
      this.endPurchase();
    }
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
      `Place your order to earn ${this.props.formattedValueBack} in credit back`
      : `Place your order for ${this.props.formattedCartTotal}`;

    const purchaseButton = [
      <ContinueButton />,
    ];

    const notReadyForPurchase = (!(this.props.creditCard.expMonth) || this.props.creditCard.loading || this.state.isUpdatingCard);
    const renderButtonColor = notReadyForPurchase ? LIGHT_GREY : Config.STUDIO_COLOR;
    const renderLeftButtons = notReadyForPurchase ? null : purchaseButton;

    const renderPurchaseButton = (
      <View style={{ overflow: 'hidden', backgroundColor: Config.STUDIO_COLOR, width: WIDTH }}>
        <Swipeable
          contentContainerStyle={{
            backgroundColor: renderButtonColor,
            paddingTop: 15,
            paddingBottom: 15,
            marginBottom: Number(isIphoneX()) && 45,
            borderWidth: 1,
            borderColor: renderButtonColor,
          }}
          leftButtons={renderLeftButtons}
          onLeftButtonsActivate={this.handlePurchase}
          leftButtonsActivationDistance={150}
        >
          <View style={{ flexDirection: 'row', position: 'relative' }}>
            <SwipeText>
              Swipe to pay
            </SwipeText>
            <SwipeArrows>
              {'>>'}
            </SwipeArrows>
          </View>
        </Swipeable>
      </View>
    );

    if (this.state.isProcessingPayment) {
      return (
        <FadeInView style={{ backgroundColor: Config.STUDIO_COLOR }}>
          <LinearLoader showQuote />
        </FadeInView>
      );
    }

    if (!this.props.cart.length) {
      return <NoItems />;
    }

    return (
      <FadeInView style={{ backgroundColor: SOFT_GREY }}>
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
  creditCard: PropTypes.shape(),
  confirmedPurchases: PropTypes.arrayOf(PropTypes.shape()),
  purchasing: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  cart: getDetailedCartEvents(state),
  formattedValueBack: getFormattedCartValueBack(state),
  valueBack: getCartValueBack(state),
  formattedCartTotal: getFormattedCartTotal(state),
  creditCard: state.creditCard,
  confirmedPurchases: getConfirmationState(state),
  purchasing: getCartIsPurchasing(state),
});

const mapDispatchToProps = {
  submitCartForPurchase,
};

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(CartPage));
