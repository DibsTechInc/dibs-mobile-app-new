import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';

import Config from '../../../config.json';

import { submitLogin } from '../../actions/UserActions';
import FadeInView from '../shared/FadeInView';
import InputField from '../shared/InputField';
import DibsLoader from '../shared/DibsLoader';

import {
  MAIN_ROUTE,
  PASSWORD_RESET_ROUTE,
} from '../../constants/RouteConstants/index';

const ForgotPasswordText = styled.Text`
  font-family: flex-font;
  font-size: 12;
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
    };

    this.handleOnPress = this.handleOnPress.bind(this);
    this.navigateToPasswordReset = this.navigateToPasswordReset.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const { email } = this.props.navigation.state.params;
    console.log(email, this.state.password);

    await new Promise(res => this.setState({ isLoading: true }, res));
    const user = await new Promise(res => this.props.submitLogin(email, this.state.password, res));

    if (!user) {
      await new Promise(res => this.setState({ isLoading: false }, res));
      Alert.alert('Incorrect password');
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
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <InputField
            label={(
              this.props.navigation.state.params.fromReset ?
                'What is your new password?' : 'What is your password?'
            )}
            autoFocus
            returnKeyType="go"
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
        </FadeInView>
      </TouchableWithoutFeedback>
    );
  }
}

EnterPassword.propTypes = {
  navigation: PropTypes.shape(),
  submitLogin: PropTypes.func,
};

const mapDispatchToProps = {
  submitLogin,
};

export default connect(null, mapDispatchToProps)(EnterPassword);
