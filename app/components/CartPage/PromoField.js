import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
<<<<<<< Updated upstream
import { View, Text, TouchableOpacity } from 'react-native';
=======
import { View, Text } from 'react-native';
>>>>>>> Stashed changes
import MaterialPanel from '../shared/MaterialPanel';
import MaterialButton from '../shared/MaterialButton';


const StyledPromoView = styled.View`
  justify-content: space-between;
  flex: 2;
`;

const StyledText = styled.Text`
  font-family: 'flex-font';
`;

const PromoCodeInput = styled.TextInput`
  border-bottom-width: 1px;
  flex: 2;
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
    this.handlePromoCodeSubmit = this.handlePromoCodeSubmit.bind(this);
  }
  /**
   * @param {string} value in input
   * @returns {undefined}
   */
  handlePromoCodeChange(value) {
    this.setState({ promoCode: value.toUpperCase() });
  }
  handlePromoCodeSubmit() {}
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
            <MaterialButton
              text="Apply"
              fontSize="14"
              style={{ width: 80, height: 40 }}
              onPress={this.handlePromoCodeSubmit}
            />
          </View>
        </StyledPromoView>
      </MaterialPanel>
    );
  }
}

PromoField.propTypes = {};

export default PromoField;
