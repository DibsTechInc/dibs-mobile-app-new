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
        <Text>Just need a few details before we get started.</Text>
        <TextInput placeholder="person@email.com" />
        <TextInput placeholder="Full name" />
        <TextInput placeholder="Password" />
        <Button title="SIGNUP" onPress={this.handleOnPress} />
      </StyledView>
    );
  }
}  

export default EnterPassword;
