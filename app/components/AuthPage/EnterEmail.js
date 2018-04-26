
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

class EnterEmail extends Component {
  constructor() {
    super();

    this.state = {
      email: '',
    }
  }

  handleOnPress(email) {
    switch (true) {
      case email === 'Old@':
        return this.props.navigation.navigate('Login');
      default:
        return this.props.navigation.navigate('Register', { email });
    }
  }

  render() {
    return (
      <StyledView>
        <Text>What is your email?</Text>
        <TextInput
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <Button title="CONTINUE" accessibilityLabel="CONTINUE" onPress={this.handleOnPress.bind(this, this.state.email)} />
      </StyledView>
    );
  }
}

export default EnterEmail;
