import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {
  MaterialButton,
  MaterialPanel,
  LinearLoader,
} from '../shared';

import {
  NormalText,
  FlexRow,
} from '../styled';

import {
  RED,
  DARK_TEXT_GREY,
  GREY,
} from '../../constants';

import Config from '../../../config.json';

const SpecialFieldText = styled(NormalText)`
  flex: 2;
  margin-right: 10px;
`;

const SpecialFieldInput = styled.TextInput`
  border-bottom-width: 1px;
  flex: 2;
  font-size: 16;
  font-family: studio-font;
  height: 40px;
  margin-right: 20px;
  margin-left: ${props => props.isCartPage ? '10px' : 0};
`;

const LoaderContainer = styled.View`
  align-items: center;
  padding-vertical: 10;
`;

const ErrorMessage = styled(NormalText)`
  color: ${RED};
  margin-top: 10;
`;

const NoticeMessage = styled(NormalText)`
  color: ${DARK_TEXT_GREY};
  margin-top: 10;
`;

/**
 * @class SpecialField
 * @extends {React.PureComponent}
 */
class SpecialField extends React.PureComponent {
  /**
   * @constructor
   * @constructs SpecialField
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.handleOnChangeText = this.handleOnChangeText.bind(this);
  }
  /**
   * @param {object} prevProps - the previously passed props
   * @returns {undefined}
   */
  componentDidUpdate(prevProps) {
    if (prevProps.shouldFocus !== this.props.shouldFocus) {
      this.textInput.focus();
    }
  }
  /**
   * @param {string} value - the input value
   * @returns {undefined}
   */
  handleOnChangeText(value) {
    this.props.handleChange(value);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <MaterialPanel
        style={{ shadowOffset: { width: 3, height: 3 }, width: '100%', ...this.props.style }}
        headerStyle={{ color: GREY }}
        heading={this.props.heading ? this.props.heading : ''}
        isCartPage={this.props.isCartPage}
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
              <SpecialFieldText>
                {this.props.currentPromoCode}
              </SpecialFieldText>
            ) : (
              <SpecialFieldInput
                onChangeText={this.handleOnChangeText}
                value={this.props.inputStateItem}
                returnKeyType="go"
                returnKeyLabel="go"
                isCartPage={this.props.isCartPage}
                innerRef={ref => this.textInput = ref}
                autoCorrect={this.props.hasAutoCorrect}
                autoCapitalize={this.props.autoCapitalize}
                onFocus={this.props.onFocusFunc}
                placeholder={this.props.placeholderText}
                onSubmitEditing={this.props.handlePress}
              />
            )}
            <MaterialButton
              text={this.props.currentPromoCode ? 'Clear' : this.props.buttonText}
              fontSize="16"
              style={{ width: 80, height: 40 }}
              onPress={this.props.handlePress}
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

SpecialField.defaultProps = {
  isCartPage: true,
  shouldAutoFocus: false,
  hasAutoCorrect: false,
  autoCapitalize: 'none',
  placeholderText: '',
};

SpecialField.propTypes = {
  noticeMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  currentPromoCode: PropTypes.string,
  submitting: PropTypes.bool,
  inputStateItem: PropTypes.string,
  handlePress: PropTypes.func,
  handleChange: PropTypes.func,
  heading: PropTypes.string,
  buttonText: PropTypes.string,
  isCartPage: PropTypes.bool,
  shouldFocus: PropTypes.bool,
  autoCapitalize: PropTypes.string,
  hasAutoCorrect: PropTypes.bool,
  onFocusFunc: PropTypes.func,
  placeholderText: PropTypes.string,
  style: PropTypes.shape(),
};

export default SpecialField;
