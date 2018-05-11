import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import { withNavigation, NavigationActions } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import FadeInView from '../shared/FadeInView';
import { FlexRow } from '../styled/Views';
import { getSortedCartEvents } from '../../selectors/CartSelectors';
import {
  getFormattedCartValueBack,
  getCartValueBack,
  getFormattedCartTotal,
} from '../../selectors/CartSelectors/PurchaseBreakdown';
import { LIGHT_GREY, SOFT_GREY, BLACK } from '../../constants';
import Icon from '../shared/Icon';
import CartItem from './CartItem';
import CartTransaction from './CartTransaction';
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
  justify-content: space-between;
  align-items: center;
  height: 100px;
  margin: 6px;
  marginBottom: 30px;
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

    if (!this.props.cart.length) {
      return (
        <FadeInView>
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
          <CartTransaction />
        </StyledScrollView>
        <StyledCheckoutView>
          <View>
            <StyledSavingsText>{renderValueBackMessage}</StyledSavingsText>
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
  navigation: PropTypes.shape().isRequired,
  cart: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  formattedValueBack: PropTypes.string.isRequired,
  valueBack: PropTypes.number.isRequired,
  formattedCartTotal: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  cart: getSortedCartEvents(state),
  formattedValueBack: getFormattedCartValueBack(state),
  valueBack: getCartValueBack(state),
  formattedCartTotal: getFormattedCartTotal(state),
});

export default withNavigation(connect(mapStateToProps)(CartPage));
