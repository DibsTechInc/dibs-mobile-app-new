import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';

import Config from '../../../config.json';

import { submitLogin, reactivateUserAccount } from '../../actions';
import FadeInView from '../shared/FadeInView';
import InputField from '../shared/InputField';
import DibsLoader from '../shared/DibsLoader';

import {
  MAIN_ROUTE,
  PASSWORD_RESET_ROUTE,
  LANDING_ROUTE,
} from '../../constants/RouteConstants/index';

const ForgotPasswordText = styled.Text`
  font-family: flex-font;
  font-size: 12;
`;

const ErrorText = styled.Text`
  font-family: flex-font;
  font-size: 12;
  color: red;
`;

/**
 * @class EnterPassword
 * @extends Component
 */
class EnterPassword extends Component {
  /**
   * @constructor
   * @constructs EnterPassword
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      password: '',
      isLoading: false,
      validInput: false,
      errorText: '',
    };

    this.handleOnPress = this.handleOnPress.bind(this);
    this.navigateToPasswordReset = this.navigateToPasswordReset.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const { email, accountDisabled } = this.props.navigation.state.params;
    if (accountDisabled) {
      const response = await new Promise(res => this.props.reactivateUserAccount(email, this.state.password, res));

      if (response.code === 200) this.props.navigation.navigate(LANDING_ROUTE, { accountReactivated: true });
      else this.setState({ errorText: response.message });
      return;
    }

    await new Promise(res => this.setState({ isLoading: true, validInput: true }, res));
    const response = await new Promise(res => this.props.submitLogin(email, this.state.password, res));
    await new Promise(res => this.setState({ isLoading: false }, res));

    if (response.code !== 200) {
      this.setState({ isLoading: false, errorText: response.message });
      return;
    }

    this.props.navigation.navigate(MAIN_ROUTE);
  }

  /**
   * @returns {undefined}
   */
  navigateToPasswordReset() {
    const { email } = this.props.navigation.state.params;
    this.props.navigation.navigate(PASSWORD_RESET_ROUTE, { email });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.state.isLoading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <DibsLoader dotColor={Config.STUDIO_COLOR} />
        </FadeInView>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center', marginBottom: '30%' }}>
          <InputField
            autoFocus={!this.state.validInput}
            label={(
              this.props.navigation.state.params.accountDisabled ?
                'Please enter the password associated with this account to reactivate it' : 'What is your password?'
            )}
            returnKeyType="go"
            blurOnSubmit={this.state.validInput}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={this.handleOnPress}
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
            containerStyle={{ marginBottom: 10, width: 200 }}
            labelStyle={{ marginBottom: 20, textAlign: 'center' }}
            style={{ minWidth: 200 }}
          />
          <TouchableOpacity
            onPress={this.navigateToPasswordReset}
            style={{ marginBottom: 20 }}
          >
            <ForgotPasswordText>
              Forgot your password?
            </ForgotPasswordText>
          </TouchableOpacity>
          {this.state.errorText.length && <ErrorText>{this.state.errorText}</ErrorText>}
        </FadeInView>
      </TouchableWithoutFeedback>
    );
  }
}

EnterPassword.propTypes = {
  navigation: PropTypes.shape(),
  submitLogin: PropTypes.func,
  reactivateUserAccount: PropTypes.func,
};

const mapDispatchToProps = {
  submitLogin,
  reactivateUserAccount,
};

export default connect(null, mapDispatchToProps)(EnterPassword);
