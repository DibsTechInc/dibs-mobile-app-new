import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import styled from 'styled-components';

import { WHITE, LIGHT_GREY } from '../../../constants';
import { SpaceBetweenRow, HeavyText } from '../../styled';
import { FadeInView, TransactionBreakdown } from '../';

const CreditRow = styled(SpaceBetweenRow)`
  align-items: center;
  border-bottom-width: 1px;
  border-color: ${LIGHT_GREY};
  padding-horizontal: 20;
  padding-top: 30;
  margin-bottom: 10;
`;

const PayAmount = styled(HeavyText)`
  font-size: 18px;
`;

/**
 * @class CreditReceipt
 * @extends {React.PureComponent}
 */
class CreditReceipt extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView
        style={{
          paddingBottom: 60,
          backgroundColor: WHITE,
        }}
      >
        <ScrollView keyboardShouldPersistTaps="always">
          <CreditRow>
            <View style={{ marginBottom: 20 }}>
              <PayAmount>
                Paid {this.props.formattedPayAmount}
              </PayAmount>
              <HeavyText>
                Received {this.props.formattedReceiveAmount}
              </HeavyText>
            </View>
          </CreditRow>
          <TransactionBreakdown
            formattedSubtotal={this.props.formattedSubtotal}
            taxAmount={this.props.tax_amount}
            formattedTaxAmount={this.props.formattedTaxAmount}
            discountAmount={this.props.discount_amount}
            formattedDiscountAmount={this.props.formattedDiscountAmount}
            studioCreditAmount={this.props.studio_credits_spent}
            formattedStudioCreditAmount={this.props.formattedStudioCreditAmount}
            rafCreditsSpent={this.props.raf_credits_spent}
            formattedRAFCreditAmount={this.props.formattedRAFCreditAmount}
            formattedTotal={this.props.formattedTotal}
          />
        </ScrollView>
      </FadeInView>
    );
  }
}

CreditReceipt.propTypes = {
  formattedSubtotal: PropTypes.string,
  tax_amount: PropTypes.number,
  formattedTaxAmount: PropTypes.string,
  discount_amount: PropTypes.number,
  formattedDiscountAmount: PropTypes.string,
  studio_credits_spent: PropTypes.number,
  formattedStudioCreditAmount: PropTypes.string,
  raf_credits_spent: PropTypes.number,
  formattedRAFCreditAmount: PropTypes.string,
  formattedTotal: PropTypes.string,
  formattedPayAmount: PropTypes.string,
  formattedReceiveAmount: PropTypes.string,
};

export default CreditReceipt;
