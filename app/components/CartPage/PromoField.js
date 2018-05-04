import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialPanel from '../shared/MaterialPanel';


const StyledPromoView = styled.View`
  justify-content: space-between;
  height: 100px;
  flex: 2;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
`;

const PromoCodeInput = styled.TextInput`
  border-bottom-width: 1px;
  flex: 1;
  height: 40px;
  margin-right: 10px;
  padding: 3px;
`;

/**
 * @class TransactionBreakdown
 * @extends {Component}
 */
class PromoField extends PureComponent {
  /**
   * @constructor
   * @constructs PromoField
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { promoCode: '' };
    this.handlePromoCodeChange = this.handlePromoCodeChange.bind(this);
  }
  /**
   * @param {string} value in input
   * @returns {undefined}
   */
  handlePromoCodeChange(value) {
    this.setState({ promoCode: value.toUpperCase() });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    // TODO handle scrolling
    return (
      <MaterialPanel
        height={150}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Promo Code"
      >
        <StyledPromoView>
          <View style={{ justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'row' }}>
            <PromoCodeInput
              onChangeText={this.handlePromoCodeChange}
              value={this.state.promoCode}
            />
            <TouchableOpacity style={{ height: 40, width: 80, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 0 }}>
              <StyledText>
                Apply
              </StyledText>
            </TouchableOpacity>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'flex-font' }}>
              Apply a coupon today!
            </Text>
          </View>
        </StyledPromoView>
      </MaterialPanel>
    );
  }
}

PromoField.propTypes = {};

export default PromoField;
