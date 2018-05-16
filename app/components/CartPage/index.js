import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Text, Alert, Dimensions } from 'react-native';
import { withNavigation, NavigationActions } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Swipeable from 'react-native-swipeable';

import FadeInView from '../shared/FadeInView';
import { FlexRow } from '../styled/Views';
import {
  getFormattedCartValueBack,
  getSortedCartEvents,
  getConfirmationState,
  getCartValueBack,
  getFormattedCartTotal,
  getCartErrorMessage,
} from '../../selectors';
import { submitCartForPurchase } from '../../actions';
import {
  SOFT_GREY,
  LIGHT_GREY,
  GREY,
  WHITE,
  BLACK,
  RECEIPT_ROUTE,
  SCHEDULE_ROUTE,
} from '../../constants';

import { Icon, CustomStatusBar, DibsLoader, PaymentInfo } from '../shared';
import CartItem from './CartItem';
import CartTransaction from './CartTransaction';
import PromoField from './PromoField';

import MaterialButton from '../shared/MaterialButton';
import Config from '../../../config.json';

const WIDTH = Dimensions.get('window').width;

const StyledScrollView = styled.ScrollView`
  flex: 1;
`;

const StyledTopView = styled.View`
  flex-direction: row;
  position: relative;
  backgroundColor: ${Config.STUDIO_COLOR};
  border-width: 1px;
  border-top-color: ${Config.STUDIO_COLOR};
  border-left-color: ${Config.STUDIO_COLOR};
  border-right-color: ${Config.STUDIO_COLOR};
  border-bottom-width: 1px;
  border-bottom-color: ${Config.STUDIO_COLOR};
  height: 80;
  justify-content: center;
  align-items: center;
`;

const StyledCheckoutView = styled.View`
  justify-content: space-between;
  align-items: center;
  height: 110px;
  border-top-width: 0.3;
  border-color: ${LIGHT_GREY};
  elevation: 3;
  background-color: ${WHITE};
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
  color: ${WHITE}
`;

const StyledContinueButton = styled.TouchableOpacity`
  padding-right: 10px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: ${props => props.hasDisabledColor ? GREY : Config.STUDIO_COLOR};
  border-width: 1px;
  border-color: ${props => props.hasDisabledColor ? GREY : Config.STUDIO_COLOR};;
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

    this.state = {
      isLoading: false,
      isUpdatingCard: false,
      isProcessingPayment: false,
    };

    this.setLoading = this.setLoading.bind(this);
    this.setEditCC = this.setEditCC.bind(this);
    this.handlePurchase = this.handlePurchase.bind(this);
  }

  /**
   * @returns {undefined}
   */
  componentDidUpdate() {
    console.log(this.props.cartMessage, '???')
    if (!this.props.cartMessage && this.props.confirmedPurchases.length) {
      this.props.navigation.navigate(RECEIPT_ROUTE);
    }

    if (this.props.cartMessage) {
      this.props.navigation.navigate(SCHEDULE_ROUTE);
      Alert.alert(this.props.cartMessage);
    }
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
  async handlePurchase() {
    this.setState({ isProcessingPayment: true });
    await new Promise(resolve => this.props.submitCartForPurchase(resolve));
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
    const renderValueBackMessage = this.props.valueBack > 0 ? `Place your order to earn ${this.props.formattedValueBack} in credit back` : `Place your order for ${this.props.formattedCartTotal}`;
    let renderCartItems = <CartItem hasEmptyCart />;

    const purchaseButton = [
      <StyledContinueButton />,
    ];

    const notReadyForPurchase = (!(this.props.creditCard.expMonth) || this.state.isLoading || this.state.isUpdatingCard);
    const renderButtonColor = notReadyForPurchase ? GREY : Config.STUDIO_COLOR;
    const renderLeftButtons = notReadyForPurchase ? null : purchaseButton;

    const renderPurchaseButton = (<View style={{ overflow: 'hidden', backgroundColor: Config.STUDIO_COLOR, width: WIDTH }}>
      <Swipeable
        contentContainerStyle={
        { backgroundColor: renderButtonColor,
          paddingTop: 15,
          paddingBottom: 15,
          borderWidth: 1,
          borderColor: renderButtonColor,
        }}
        leftButtons={renderLeftButtons}
        onLeftButtonsActivate={this.handlePurchase}
        leftButtonsActivationDistance={150}
      >
        <View style={{ flexDirection: 'row', position: 'relative' }}>
          <Text style={{ textAlign: 'center', color: WHITE, flex: 1 }}>Swipe to pay</Text>
          <Text style={{ color: WHITE, position: 'absolute', right: 40 }}>{'>>'}</Text>
        </View>
      </Swipeable>
    </View>);

    if (this.state.isProcessingPayment) {
      return <FadeInView style={{ backgroundColor: Config.STUDIO_COLOR }}><DibsLoader showText /></FadeInView>;
    }

    if (!this.props.cart.length) {
      return (
        <FadeInView>
          <CustomStatusBar backgroundColor={Config.STUDIO_COLOR} barStyle="light-content" />
          <StyledTopView>
            <Icon
              iconName="arrow-left"
              iconColor={WHITE}
              onPress={this.toPreviousPage}
              style={{ position: 'absolute', left: 0, fontSize: 11 }}
            />
            <StyledCenterText>
              My Cart
            </StyledCenterText>
          </StyledTopView>
          <StyledScrollView>
            {renderCartItems}
          </StyledScrollView>
          <StyledCheckoutView>
            <FlexRow>
              <MaterialButton
                text="Class Schedule"
                onPress={() => { this.props.navigation.navigate(SCHEDULE_ROUTE); }}
                style={{ flex: 1, height: 50 }}
                borderRadius={0}
              />
            </FlexRow>
          </StyledCheckoutView>
        </FadeInView>
      );
    }

    renderCartItems = this.props.cart.map(item =>
      (<CartItem
        key={item.eventid}
        eventid={item.eventid}
        name={item.name}
        quantity={item.quantity}
        startTime={item.startTime}
        price={item.price}
        taxRate={item.taxRate}
        passid={item.passid}
        instructorName={item.instructorName}
        locationName={item.locationName}
      />)
    );

    console.log(this.props.cart, 'cart')

    return (
      <FadeInView style={{ backgroundColor: SOFT_GREY }}>
        <CustomStatusBar backgroundColor={Config.STUDIO_COLOR} barStyle="light-content" />
        <StyledTopView>
          <Icon
            iconName="arrow-left"
            iconColor={WHITE}
            onPress={this.toPreviousPage}
            style={{ position: 'absolute', left: 0, fontSize: 11 }}
          />
          <StyledCenterText>
            My Cart
          </StyledCenterText>
        </StyledTopView>
        <StyledScrollView>
          {renderCartItems}
          <PaymentInfo
            isLoading={this.state.isLoading}
            isUpdatingCard={this.state.isUpdatingCard}
            setLoading={this.setLoading}
            setEditCC={this.setEditCC}
          />
          <PromoField />
          <CartTransaction />
        </StyledScrollView>
        <StyledCheckoutView>
          <View style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '50%' }}>
            <StyledSavingsText>{renderValueBackMessage}</StyledSavingsText>
          </View>
          <FlexRow>
            {renderPurchaseButton}
          </FlexRow>
        </StyledCheckoutView>
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
  cartMessage: PropTypes.string,
  creditCard: PropTypes.shape(),
  confirmedPurchases: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  cart: getSortedCartEvents(state),
  formattedValueBack: getFormattedCartValueBack(state),
  valueBack: getCartValueBack(state),
  formattedCartTotal: getFormattedCartTotal(state),
  creditCard: state.creditCard,
  confirmedPurchases: getConfirmationState(state),
  cartMessage: getCartErrorMessage(state),
});

const mapDispatchToProps = {
  submitCartForPurchase,
};

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(CartPage));
