import React, { Component } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import styled from 'styled-components';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

class EnterPassword extends Component {
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  handleOnPress() {
    this.props.navigation.navigate('Main');
  }

  render() {
    return (
      <StyledView>
        <Text>What is your password?</Text>
        <TextInput placeholder="Password" />
        <Button title="SUBMIT" onPress={this.handleOnPress} />
      </StyledView>
    );
  }
}  

export default EnterPassword;
