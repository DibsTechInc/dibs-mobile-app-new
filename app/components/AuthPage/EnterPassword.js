import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';

import { submitLogin } from '../../actions/UserActions';
import FadeInView from '../shared/FadeInView';

import {
  MAIN_ROUTE,
} from '../../constants/RouteConstants/index';

const StyledTextInput = styled.TextInput`
  font-family: flex-font;
  height: 25;
`;

const StyledInputView = styled.View`
  border-bottom-width: 1;
  border-bottom-color: #8fc54b;
  height: 25;
  margin-bottom: 15%;
  margin-top: 15%;
  width: 50%;
`;

const StyledText = styled.Text`
  font-family: flex-font-heavy;
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
      password: '123',
      isLoading: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const email = this.props.navigation.state.params.email;

    await new Promise(res => this.setState({ isLoading: true }, res));
    const user = await new Promise(res => this.props.submitLogin(email, this.state.password, res));

    if (!user) {
      await new Promise(res => this.setState({ isLoading: false }, res));
      Alert.alert('Incorrect password');
    }

    this.props.navigation.navigate(MAIN_ROUTE);
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.state.isLoading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <StyledText>Loading...</StyledText>
        </FadeInView>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <StyledText>What is your password?</StyledText>
          <StyledInputView>
            <StyledTextInput
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={this.handleOnPress}
              onChangeText={password => this.setState({ password })}
              value={this.state.password}
            />
          </StyledInputView>
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
