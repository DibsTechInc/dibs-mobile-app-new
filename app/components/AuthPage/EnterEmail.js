
import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import {
  Text,
  Button,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';

import { FlexCenter } from '../styled';
import { validateEmail } from '../../actions/UserActions';

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
      email: 'benjamin@on.com',
      emailError: '',
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
      return this.setState({
        emailError: 'Invalid Email',
      });
    }

    const route = await new Promise(res => this.props.validateEmail(email, res));
    if (route) this.props.navigation.navigate(route, { email });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <FlexCenter>
          <Text> What is your email? </Text>
          <StyledInputView>
            <StyledTextInput
              placeholder="Email"
              onChangeText={email => this.setState({ email })}
              value={this.state.email}
            />
          </StyledInputView>
          <Button
            title="CONTINUE"
            accessibilityLabel="CONTINUE"
            onPress={this.handleOnPress}
          />
          {this.state.emailError.length && <Text>{this.state.emailError}</Text>}
        </FlexCenter>
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
