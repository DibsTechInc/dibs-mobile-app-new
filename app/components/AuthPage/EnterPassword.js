import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Text,
  Button,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';

import { submitLogin } from '../../actions/UserActions';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
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
    };
    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const email = this.props.navigation.state.params.email;

    const user = await new Promise(res => this.props.submitLogin(email, this.state.password, res));
    if (!user) {
      Alert.alert('Incorrect password');
    }
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <StyledView>
          <Text>What is your password?</Text>
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={{ width: 150 }}
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
          />
          <Button
            title="SUBMIT"
            onPress={this.handleOnPress}
          />
        </StyledView>
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
