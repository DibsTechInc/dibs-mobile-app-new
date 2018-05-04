import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, Text } from 'react-native';

import { WHITE, TEXT_GREY, LIGHT_GREY, GREEN, GREY } from '../../constants';

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
class CartItem extends PureComponent {
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
            <Text style={{ fontSize: 16 }}>Start Date</Text>
            <Text style={{ fontSize: 16 }}>{this.props.startTime}</Text>
          </View>
        </View>

        <View style={{ borderWidth: 1, borderColor: LIGHT_GREY }}>
          <View style={{ flexDirection: 'row', margin: 10 }}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{this.props.quantity} Quantity</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16 }}>${this.props.price}</Text>
            </View>
          </View>
        </View>
      </StyledCartItemView>
    );
  }
}

CartItem.propTypes = {
  name: PropTypes.string,
  quantity: PropTypes.number,
  price: PropTypes.number,
  startTime: PropTypes.string,
  hasEmptyCart: PropTypes.bool,
};

export default CartItem;
