
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
import Swiper from 'react-native-swiper'

import About from './About';

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

  componentDidMount() {
    
  }

  handleOnPress() {
    this.props.navigation.navigate('Verify');
  }

  render() {
    return (
      <Swiper loop={false}>
        <StyledView>
          <Text>Welcome to FLEX Studios!</Text>
          <Text>Swipe to learn more</Text>
          <Button title="CONTINUE" accessibilityLabel="CONTINUE" onPress={this.handleOnPress} />
        </StyledView>
        <About />
      </Swiper>
    );
  }
}

export default LandingPage;
