
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

class LandingPage extends Component {
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  handleOnPress() {
    this.props.navigation.navigate('Verify');
  }

  render() {
    return (
      <StyledView>
        <Text>Welcome to FLEX Studios!</Text>
        <Text>Swipe to learn more</Text>
        <Button title="CONTINUE" accessibilityLabel="CONTINUE" onPress={this.handleOnPress} />
      </StyledView>
    );
  }
}

export default LandingPage;
