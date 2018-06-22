import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Config from '../../../config.json';
import { RED, DARK_TEXT_GREY, GREY } from '../../constants';
import { getAppliedPromoCode, getPromoCodeIsSubmitting, getPromoCodeError, getPromoCodeNotice } from '../../selectors';
import { verifyPromoCode, clearPromoCodeError, clearPromoCodeNotice, clearPromoCode } from '../../actions';
import { PROMO_PRODUCT_PACKAGE, PROMO_PRODUCT_CLASS } from '../../constants';
import MaterialPanel from '../shared/MaterialPanel';
import MaterialButton from '../shared/MaterialButton';
import LinearLoader from '../shared/LinearLoader';
import { FlexRow, NormalText } from '../styled';

const PromoCodeText = NormalText.extend`
  flex: 2;
  margin-right: 10px;
`;

const PromoCodeInput = styled.TextInput`
  border-bottom-width: 1px;
  flex: 2;
  font-size: 16;
  font-family: studio-font;
  height: 40px;
  margin-right: 20px;
  margin-left: 10px;
  padding: 3px;
`;

const LoaderContainer = styled.View`
  align-items: center;
  padding-vertical: 10;
`;

const ErrorMessage = NormalText.extend`
  color: ${RED};
  margin-top: 10;
`;

const NoticeMessage = NormalText.extend`
  color: ${DARK_TEXT_GREY};
  margin-top: 10;
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
    this.handlePress = this.handlePress.bind(this);
  }
  /**
   * @param {Object} props component will receive
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (!this.props.errorMessage && props.errorMessage) {
      if (this.clearErrorTimer) clearTimeout(this.clearErrorTimer);
      this.clearErrorTimer = setTimeout(() => {
        this.props.clearPromoCodeError();
        this.clearErrorTimer = null;
      }, 5e3);
    }
    if (!this.props.noticeMessage && props.noticeMessage) {
      if (this.clearNoticeTimer) clearTimeout(this.clearNoticeTimer);
      this.clearNoticeTimer = setTimeout(() => {
        this.props.clearPromoCodeNotice();
        this.clearNoticeTimer = null;
      }, 5e3);
    }
  }
  /**
   * @param {string} value in input
   * @returns {undefined}
   */
  handlePromoCodeChange(value) {
    this.setState({ promoCode: value.toUpperCase() });
  }
  /**
   * @returns {undefined}
   */
  handlePress() {
    const promoCodeType = this.props.packages.length ? PROMO_PRODUCT_PACKAGE : PROMO_PRODUCT_CLASS;

    return this.props.currentPromoCode ?
      this.setState({ promoCode: '' }, () => this.props.clearPromoCode()) :
      this.props.verifyPromoCode(this.state.promoCode, promoCodeType);
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    // TODO handle scrolling
    return (
      <MaterialPanel
        style={{ shadowOffset: { width: 3, height: 3 }, width: '100%' }}
        headerStyle={{ marginLeft: 10, color: GREY }}
        heading="Promo Code"
      >
        {this.props.submitting ? (
          <LoaderContainer>
            <LinearLoader
              color={Config.STUDIO_COLOR}
              width={150}
            />
          </LoaderContainer>
        ) : (
          <FlexRow style={{ alignItems: 'center' }}>
            {this.props.currentPromoCode ? (
              <PromoCodeText>
                {this.props.currentPromoCode}
              </PromoCodeText>
            ) : (
              <PromoCodeInput
                onChangeText={this.handlePromoCodeChange}
                value={this.state.promoCode}
              />
            )}
            <MaterialButton
              text={this.props.currentPromoCode ? 'Clear' : 'Apply'}
              fontSize="16"
              style={{ width: 80, height: 40 }}
              onPress={this.handlePress}
              disabled={!this.state.promoCode}
            />
          </FlexRow>
        )}
        {this.props.errorMessage ? (
          <ErrorMessage>
            {this.props.errorMessage}
          </ErrorMessage>
        ) : null}
        {this.props.noticeMessage ? (
          <NoticeMessage>
            {this.props.noticeMessage}
          </NoticeMessage>
        ) : null}
      </MaterialPanel>
    );
  }
}

PromoField.propTypes = {
  submitting: PropTypes.bool.isRequired,
  currentPromoCode: PropTypes.string.isRequired,
  errorMessage: PropTypes.string.isRequired,
  noticeMessage: PropTypes.string.isRequired,
  verifyPromoCode: PropTypes.func.isRequired,
  clearPromoCodeError: PropTypes.func.isRequired,
  clearPromoCodeNotice: PropTypes.func.isRequired,
  clearPromoCode: PropTypes.func.isRequired,
  events: PropTypes.arrayOf(PropTypes.shape()),
  packages: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  currentPromoCode: getAppliedPromoCode(state),
  submitting: getPromoCodeIsSubmitting(state),
  errorMessage: getPromoCodeError(state),
  noticeMessage: getPromoCodeNotice(state),
});
const mapDispatchToProps = {
  verifyPromoCode,
  clearPromoCodeError,
  clearPromoCodeNotice,
  clearPromoCode,
};

export default connect(mapStateToProps, mapDispatchToProps)(PromoField);
