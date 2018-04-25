
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
import { lightenDarkenColor } from '../../helpers';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${lightenDarkenColor('#8dc63f', 90)};
`;

class LandingPage extends Component {
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
        <Text>Welcome to FLEX Studios!</Text>
        <Text>Please enter your email address</Text>
        <TextInput
          placeholder="email address"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <Button title="CONTINUE" accessibilityLabel="CONTINUE" onPress={this.handleOnPress.bind(this, this.state.email)} />
      </StyledView>
    );
  }
}

export default LandingPage;
