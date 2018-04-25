import React, { Component } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import styled from 'styled-components';
import { lightenDarkenColor } from '../../helpers';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${lightenDarkenColor('#8dc63f', 60)};
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
    console.log(this.props, '??')
    return (
      <StyledView>
        <Text>Welcome!</Text>
        <Text>Just need a few details before we get started:</Text>
        <TextInput placeholder="person@email.com" />
        <TextInput placeholder="Full name" />
        <TextInput placeholder="Password" />
        <Button title="SIGNUP" onPress={this.handleOnPress} />
      </StyledView>
    );
  }
}  

export default EnterPassword;
