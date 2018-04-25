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
    return (
      <StyledView>
        <Text>Enter your password</Text>
        <TextInput placeholder="password" />
        <Button title="SUBMIT" onPress={this.handleOnPress} />
      </StyledView>
    );
  }
}  

export default EnterPassword;
