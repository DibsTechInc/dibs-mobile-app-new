import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const StyledPromoView = styled.View`
  justify-content: space-between;
  margin: 20px;
  height: 100px;
  flex: 2;
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
          <Text style={{ fontSize: 16, fontFamily: 'flex-font-heavy' }}>Promotional Code</Text>
        </View>
        <View style={{ justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'row' }}>
          <TextInput style={{ height: 40, width: 250, borderWidth: 1 }} />
          <TouchableOpacity style={{ height: 40, width: 80, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 0 }}>
            <StyledText>Apply</StyledText>
          </TouchableOpacity>
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
