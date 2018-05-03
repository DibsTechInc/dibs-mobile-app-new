import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { View, Text } from 'react-native';

const StyledPromoView = styled.View`
  margin: 20px;
  height: 135px;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PromoField extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledPromoView>
        <View>
          <Text style={{ fontSize: 16, fontFamily: 'flex-font-heavy' }}>Spring Promotions</Text>
        </View>
        <View>
          <Text>Field To Enter Promo Code</Text>
        </View>
        <View>
          <Text style={{ fontSize: 16, fontFamily: 'flex-font' }}>
            Apply a coupon today!
          </Text>
        </View>
      </StyledPromoView>
    );
  }
}

PromoField.propTypes = {};

export default PromoField;
