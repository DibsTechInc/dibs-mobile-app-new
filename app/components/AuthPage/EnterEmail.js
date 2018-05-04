
import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import {
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';

import { validateEmail } from '../../actions/UserActions';
import FadeInView from '../shared/FadeInView';


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
 * @class EnterEmail
 * @extends Component
 */
class EnterEmail extends Component {
  /**
   * @constructor
   * @constructs EnterEmail
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      email: 'benjamin@ondibs.com',
      emailError: '',
      isLoading: false,
    };
    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const { email } = this.state;

    const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const isValidEmail = validEmail.test(email);

    if (!isValidEmail) {
      this.setState({
        emailError: 'Invalid Email',
      });
      return;
    }

    await new Promise(res => this.setState({ isLoading: true }, res));
    const route = await new Promise(res => this.props.validateEmail(email, res));
    await new Promise(res => this.setState({ isLoading: false }, res));

    if (!route) {
      await new Promise(res => this.setState({ isLoading: false }, res));
      Alert.alert('We could not verify this email');
    } else {
      this.props.navigation.navigate(route, { email });
    }
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
          <StyledText> What is your email? </StyledText>
          <StyledInputView>
            <StyledTextInput
              autoFocus
              returnKeyType="go"
              placeholder="Email"
              autoCapitalize="none"
              onChangeText={email => this.setState({ email })}
              onSubmitEditing={this.handleOnPress}
              value={this.state.email}
            />
          </StyledInputView>
          {this.state.emailError.length && <Text style={{ color: 'red' }}>{this.state.emailError}</Text>}
        </FadeInView>
      </TouchableWithoutFeedback>
    );
  }
}

EnterEmail.propTypes = {
  navigation: PropTypes.shape(),
};

const mapDispatchToProps = {
  validateEmail,
};

export default connect(null, mapDispatchToProps)(EnterEmail);
