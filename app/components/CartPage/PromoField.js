import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Config from '../../../config.json';
import { RED } from '../../constants';
import { getPromoCodeName, getPromoCodeIsSubmitting, getPromoCodeError } from '../../selectors';
import { verifyPromoCode, clearPromoCodeError } from '../../actions';
import MaterialPanel from '../shared/MaterialPanel';
import MaterialButton from '../shared/MaterialButton';
import DibsLoader from '../shared/DibsLoader';
import { FlexRow } from '../styled';

const PromoCodeInput = styled.TextInput`
  border-bottom-width: 1px;
  flex: 2;
  height: 40px;
  margin-right: 10px;
  padding: 3px;
`;

const LoaderContainer = styled.View`
  align-items: center;
  padding-vertical: 10;
`;

const ErrorMessage = styled.Text`
  color: ${RED};
  font-family: 'flex-font';
  font-size: 14;
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
    this.handlePromoCodeSubmit = this.handlePromoCodeSubmit.bind(this);
  }
  /**
   * @param {Object} props component will receive
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (!this.props.errorMessage && props.errorMessage) {
      if (this.clearErrorTimer) clearTimeout(this.clearErrorTimer);
      this.clearErrorTimer = setTimeout(() => this.props.clearPromoCodeError(), 5e3);
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
  handlePromoCodeSubmit() {
    this.props.verifyPromoCode(this.state.promoCode);
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    // TODO handle scrolling
    return (
      <MaterialPanel
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Promo Code"
      >
        {this.props.submitting ? (
          <LoaderContainer>
            <DibsLoader
              dotColor={Config.STUDIO_COLOR}
              width={150}
            />
          </LoaderContainer>
        ) : null}
        {!this.props.currentPromoCode && !this.props.submitting ? (
          <FlexRow>
            <PromoCodeInput
              onChangeText={this.handlePromoCodeChange}
              value={this.state.promoCode}
            />
            <MaterialButton
              text="Apply"
              fontSize="14"
              style={{ width: 80, height: 40 }}
              onPress={this.handlePromoCodeSubmit}
              disabled={!this.state.promoCode}
            />
          </FlexRow>
        ) : null}
        {this.props.errorMessage ? (
          <ErrorMessage>
            {this.props.errorMessage}
          </ErrorMessage>
        ) : null}
      </MaterialPanel>
    );
  }
}

PromoField.propTypes = {
  submitting: PropTypes.bool.isRequired,
  currentPromoCode: PropTypes.string.isRequired,
  errorMessage: PropTypes.string.isRequired,
  verifyPromoCode: PropTypes.func.isRequired,
  clearPromoCodeError: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  currentPromoCode: getPromoCodeName(state),
  submitting: getPromoCodeIsSubmitting(state),
  errorMessage: getPromoCodeError(state),
});
const mapDispatchToProps = {
  verifyPromoCode,
  clearPromoCodeError,
};

export default connect(mapStateToProps, mapDispatchToProps)(PromoField);
