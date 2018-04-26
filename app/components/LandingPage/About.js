
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

class About extends Component {
  render() {
    return (
      <StyledView>
        <Text>About FLEX Studios</Text>
        <Text>GET RIPPED</Text>
      </StyledView>
    );
  }
}

export default About;
