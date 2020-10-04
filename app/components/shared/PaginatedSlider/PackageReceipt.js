import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import styled from 'styled-components';

import { WHITE, LIGHT_GREY, TEXT_GREY } from '../../../constants';
import FadeInView from '../FadeInView';
import { SpaceBetweenRow, HeavyText, NormalText } from '../../styled';
import TransactionBreakdown from '../TransactionBreakdown';

const PackageRow = styled(SpaceBetweenRow)`
  align-items: center;
  border-bottom-width: 1px;
  border-color: ${LIGHT_GREY};
  padding-horizontal: 20;
  padding-top: 30;
  margin-bottom: 10;
`;

const GreyText = styled(NormalText)`
  color: ${TEXT_GREY};
`;

/**
 * @class PackageReceipt
 * @extends {React.PureComponent}
 */
class PackageReceipt extends React.PureComponent {
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
          <PackageRow>
            <View style={{ marginBottom: 10 }}>
              <HeavyText>
                {this.props.name}
              </HeavyText>
              {this.props.additionalPackageDescription &&
                <NormalText>
                  {this.props.additionalPackageDescription}
                </NormalText>}
              {!this.props.unlimited && !this.props.onlyFirstPurchase ?
                <NormalText>
                  {this.props.formattedPricePerClass} / class
            </NormalText> : undefined}
              {this.props.unlimited ?
                <GreyText>
                  {this.props.commitment_period} month commitment
            </GreyText> : undefined}
              {!this.props.unlimited ?
                <GreyText>
                  {this.props.expirationText}
                </GreyText> : undefined}
            </View>
          </PackageRow>
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

PackageReceipt.propTypes = {
  name: PropTypes.string,
  additionalPackageDescription: PropTypes.string,
  unlimited: PropTypes.bool,
  onlyFirstPurchase: PropTypes.bool,
  formattedPricePerClass: PropTypes.string,
  commitment_period: PropTypes.number,
  expirationText: PropTypes.string,
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
};

export default PackageReceipt;
