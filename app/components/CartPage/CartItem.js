import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, Text } from 'react-native';

import { addToCart, removeOneEventItem } from '../../actions/CartActions';
import { TEXT_GREY, LIGHT_GREY } from '../../constants';
import Icon from '../shared/Icon';

const StyledCartItemView = styled.View`
  margin: 10px;
  min-height: 100px;
`;

// const StyledCartDetailHeaderView = styled.View`
//   height: 20
// `;

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'flex-font-heavy' }}>{this.props.name}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16 }}>{moment(this.props.startTime).format('MMM. D, YYYY [at] h:mm A z')}</Text>
          </View>
        </View>

        <View style={{ borderWidth: 1, borderColor: LIGHT_GREY }}>
          <View style={{ flexDirection: 'row', margin: 10 }}>
            <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>${this.props.price}</Text>
            </View>
          </View>
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
};

const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

export default connect(null, mapDispatchToProps)(CartItem);
