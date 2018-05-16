import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, Text } from 'react-native';
import { format as formatCurrency } from 'currency-formatter';

import { addToCart, removeOneEventItem } from '../../actions';
import { getStudioCurrency } from '../../selectors';
import { TEXT_GREY, GREY } from '../../constants';
import Icon from '../shared/Icon';

const StyledCartItemView = styled.View`
  margin: 10px;
  min-height: 100px;
  flex-direction: row;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
`;

/**
 * @class CartItem
 * @extends {Component}
 */
class CartItem extends Component {
    /**
   * @constructor
   * @constructs Overlay
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.addToCart = this.addToCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
  }
  /**
   * @returns {undefined}
   */
  addToCart() {
    this.props.addToCart({
      eventid: this.props.eventid,
      passid: this.props.passid,
      price: this.props.price,
      taxRate: this.props.taxRate,
      name: this.props.name,
      startTime: this.props.startTime,
    });
  }

  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeOneEventItem(this.props.eventid);
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.props.hasEmptyCart) {
      return (
        <StyledCartItemView>
          <StyledText>Your cart is empty</StyledText>
        </StyledCartItemView>
      );
    }

    return (
      <StyledCartItemView>
        <View style={{ justifyContent: 'space-between', flex: 1 }}>
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'flex-font-heavy' }}>{moment(this.props.startTime).format('ddd M/D')}</Text>
            <Text style={{ fontSize: 16, fontFamily: 'flex-font' }}>{moment(this.props.startTime).format('h:mm A z [@]')} Kensington</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'flex-font-heavy' }}>{this.props.name}</Text>
            <Text style={{ fontSize: 16, fontFamily: 'flex-font', color: GREY }}>{formatCurrency(this.props.price, { code: this.props.currency, precision: (this.props.price % 1 && 2) })}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {this.props.showCartAdjustments && <Icon
            size={15}
            iconName={this.props.quantity > 1 ? 'minus' : 'trash'}
            iconColor={TEXT_GREY}
            padding={10}
            onPress={this.removeFromCart}
          />}
          <Text style={{ fontSize: 16, marginLeft: 25, marginRight: 25 }}>{this.props.quantity}</Text>
          {this.props.showCartAdjustments && this.props.quantity <= 3 && <Icon
            size={15}
            iconName="plus"
            iconColor={TEXT_GREY}
            padding={10}
            onPress={this.addToCart}
          />}
        </View>
      </StyledCartItemView>
    );
  }
}

CartItem.defaultProps = {
  showCartAdjustments: true,
};

CartItem.propTypes = {
  name: PropTypes.string,
  quantity: PropTypes.number,
  passid: PropTypes.number,
  price: PropTypes.number,
  startTime: PropTypes.string,
  taxRate: PropTypes.number,
  eventid: PropTypes.number,
  hasEmptyCart: PropTypes.bool,
  removeOneEventItem: PropTypes.func,
  addToCart: PropTypes.func,
  showCartAdjustments: PropTypes.bool,
  currency: PropTypes.string,
};

const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

const mapStateToProps = state => ({
  currency: getStudioCurrency(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(CartItem);
