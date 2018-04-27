
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';
import Swiper from 'react-native-swiper'

import About from './About';

const StyledView = styled.View`
  flex: 1;
`;

const StyledButtonsView = StyledView.extend`
  align-items: center;
`;

const StyledWelcomeView = styled.View`
  flex: 5;
  align-items: center;
  justify-content: center;
`;

const StyledBoldText = styled.Text`
  font-family: 'flex-font';
`;

const StyledGrayText = styled.Text`
  font-family: 'flex-font';
  color: #b1b1b1;
`;

const StyledButtonText = styled.Text`
  color: #fff;
`;

const StyledContinueButton = styled.TouchableOpacity`
  padding-left: 50px;
  padding-right: 50px;
  padding-top: 5px;
  padding-bottom: 5px;
  background-color: #8fc54b;
  border-radius: 5px;
  border-width: 1px;
  border-color: #8fc54b;
`;

class LandingPage extends Component {
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  componentDidMount() {
    // jwt call here
  }

  handleOnPress() {
    this.props.navigation.navigate('Verify');
  }

  render() {
    return (
      <Swiper loop={false}>
        <View style={{ flex: 1 }}>
          <StyledWelcomeView>
            <StyledBoldText>Welcome to FLEX Studios!</StyledBoldText>
            <StyledGrayText>Swipe to learn more</StyledGrayText>
          </StyledWelcomeView>
          
          <StyledButtonsView>
            <StyledContinueButton onPress={this.handleOnPress}> 
              <StyledButtonText>Continue</StyledButtonText>
            </StyledContinueButton>
          </StyledButtonsView>
          

        </View>
        <About />
      </Swiper>
    );
  }
}

export default LandingPage;
