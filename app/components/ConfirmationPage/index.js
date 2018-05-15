import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Text, Alert } from 'react-native';
import { withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';
import Swipeable from 'react-native-swipeable';
import styled from 'styled-components';
import FadeInView from '../shared/FadeInView';
import {
  SOFT_GREY,
  GREY,
  WHITE,
  RECEIPT_ROUTE,
  SCHEDULE_ROUTE,
} from '../../constants';
import { getSortedCartEvents, getConfirmationState, getCartErrorMessage } from '../../selectors';
import Config from '../../../config.json';
import { Icon, CustomStatusBar, DibsLoader, PaymentInfo } from '../shared';
import CartItem from '../CartPage/CartItem';
import CartTransaction from '../CartPage/CartTransaction';
import { MaterialPanelView } from '../styled';
import { submitCartForPurchase } from '../../actions';

const StyledScrollView = styled.ScrollView`
  flex: 2;
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

const StyledCenterText = styled.Text`
  font-family: 'flex-font-heavy';
  text-align: center;
  font-size: 16px;
  color: ${WHITE};
`;

/**
 * @class ConfirmationPage
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
      isUpdatingCard: false,
      isProcessingPayment: false,
    };

    this.toPreviousPage = this.toPreviousPage.bind(this);
    this.setLoading = this.setLoading.bind(this);
    this.setEditCC = this.setEditCC.bind(this);
    this.handlePurchase = this.handlePurchase.bind(this);
  }

  /**
   * @returns {undefined}
   */
  componentDidUpdate() {
    if (!this.props.cartMessage.length && this.props.confirmedPurchases.length) {
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
  toPreviousPage() {
    this.props.navigation.navigate('Cart');
  }

   /**
   * @returns {undefined}
   */
  async handlePurchase() {
    this.setState({ isProcessingPayment: true });
    await new Promise(resolve => this.props.submitCartForPurchase(resolve));
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    const purchaseButton = [
      <StyledContinueButton />,
    ];

    const notReadyForPurchase = (!(this.props.creditCard.expMonth) || this.state.isLoading || this.state.isUpdatingCard);
    const renderButtonColor = notReadyForPurchase ? GREY : Config.STUDIO_COLOR;
    const renderLeftButtons = notReadyForPurchase ? null : purchaseButton;

    const renderCartItems = this.props.cart.map(cart =>
        (<CartItem
          key={cart.eventid}
          eventid={cart.eventid}
          name={cart.name}
          quantity={cart.quantity}
          startTime={cart.startTime}
          price={cart.price}
          showCartAdjustments={false}
        />)
      );

    const renderPurchaseButton = (<View style={{ width: 390, overflow: 'hidden', backgroundColor: Config.STUDIO_COLOR, borderRadius: 5 }}>
      <Swipeable
        contentContainerStyle={
        { backgroundColor: renderButtonColor,
          paddingLeft: 100,
          paddingRight: 100,
          paddingTop: 15,
          paddingBottom: 15,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: renderButtonColor,
        }}
        leftButtons={renderLeftButtons}
        onLeftButtonsActivate={this.handlePurchase}
        leftButtonsActivationDistance={150}
      >
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ textAlign: 'center', color: WHITE, flex: 1 }}>Swipe to pay</Text>
          <Text style={{ color: WHITE }}>{'>>'}</Text>
        </View>
      </Swipeable>
    </View>);

    if (this.state.isProcessingPayment) {
      return <FadeInView style={{ backgroundColor: Config.STUDIO_COLOR }}><DibsLoader showText /></FadeInView>;
    }

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
            Confirm Checkout
          </StyledCenterText>
        </StyledTopView>
        <StyledScrollView style={{ marginTop: 0 }}>
          <CartTransaction />
          <PaymentInfo
            isLoading={this.state.isLoading}
            isUpdatingCard={this.state.isUpdatingCard}
            setLoading={this.setLoading}
            setEditCC={this.setEditCC}
          />
          <MaterialPanelView style={{ shadowOffset: { width: 3, height: 3 } }}>
            {renderCartItems}
          </MaterialPanelView>
        </StyledScrollView>
        <StyledCheckoutView>
          {renderPurchaseButton}
        </StyledCheckoutView>
      </FadeInView>
    );
  }
}

ConfirmationPage.propTypes = {
  navigation: PropTypes.shape(),
  creditCard: PropTypes.shape(),
  cart: PropTypes.arrayOf(PropTypes.shape()),
  submitCartForPurchase: PropTypes.func,
  confirmedPurchases: PropTypes.arrayOf(PropTypes.shape()),
  cartMessage: PropTypes.string,
};

const mapStateToProps = state => ({
  creditCard: state.creditCard,
  cart: getSortedCartEvents(state),
  confirmedPurchases: getConfirmationState(state),
  cartMessage: getCartErrorMessage(state),
});

const mapDispatchToProps = {
  submitCartForPurchase,
};

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(ConfirmationPage));
