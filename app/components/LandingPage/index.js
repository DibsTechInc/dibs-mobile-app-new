
import React, { Component } from 'react';

import {
  AsyncStorage,
} from 'react-native';

import styled from 'styled-components';
import Swiper from 'react-native-swiper';

import About from './About';
import { VERIFY_ROUTE } from '../../constants/RouteConstants/index';
import Config from '../../../config.json';
import FadeInView from '../shared/FadeInView';

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
  font-size: 14px;
`;

const StyledButtonText = StyledWelcomeText.extend`
  color: #fff;
`;

const StyledGrayText = StyledWelcomeText.extend`
  color: #b1b1b1;
`;

const StyledContinueButton = styled.TouchableOpacity`
  padding-left: 100px;
  padding-right: 100px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: #8fc54b;
  border-radius: 5px;
  border-width: 1px;
  border-color: #8fc54b;
`;

class LandingPage extends Component {
  constructor() {
    super();

    this.checkAuth();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  handleOnPress() {
    this.props.navigation.navigate(VERIFY_ROUTE);
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
        <FadeInView style={{ flex: 1 }}>
          <StyledWelcomeView>
            <StyledWelcomeText>Welcome to FLEX Studios!</StyledWelcomeText>
            <StyledGrayText>Swipe to learn more</StyledGrayText>
          </StyledWelcomeView>
          <StyledButtonsView>
            <StyledContinueButton onPress={this.handleOnPress}>
              <StyledButtonText>Continue</StyledButtonText>
            </StyledContinueButton>
          </StyledButtonsView>
        </FadeInView>
        <About />
      </Swiper>
    );
  }
}

LandingPage.navigationOptions = {
  headerMode: 'none',
}

export default LandingPage;
