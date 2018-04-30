
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  AsyncStorage,
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';
import Swiper from 'react-native-swiper';

import About from './About';
import { authFetch } from '../../helpers';
import { VERIFY_ROUTE } from '../../constants/RouteConstants/index';
import Config from '../../../config.json';

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

const StyledWelcomeText = styled.Text`
  font-family: 'flex-font';
`;

const StyledButtonText = StyledWelcomeText.extend`
  color: #fff;
`;

const StyledGrayText = StyledWelcomeText.extend`
  color: #b1b1b1;
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

  handleOnPress() {
    this.props.navigation.navigate(VERIFY_ROUTE);
  }

  componentDidMount() {
    this.checkAuth();
  }

  async checkAuth() {
    const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
    if (token) {
      this.props.navigation.navigate('Drawer');
    }
  }

  render() {
    return (
      <Swiper loop={false}>
        <StyledView>
          <StyledWelcomeView>
            <StyledWelcomeText>Welcome to FLEX Studios!</StyledWelcomeText>
            <StyledGrayText>Swipe to learn more</StyledGrayText>
          </StyledWelcomeView>
          <StyledButtonsView>
            <StyledContinueButton onPress={this.handleOnPress}>
              <StyledButtonText>Continue</StyledButtonText>
            </StyledContinueButton>
          </StyledButtonsView>
        </StyledView>
        <About />
      </Swiper>
    );
  }
}

LandingPage.navigationOptions = {
  headerMode: 'none',
}

export default LandingPage;
