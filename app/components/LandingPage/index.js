
import React, { Component } from 'react';
// temp
import { connect } from 'react-redux';
import { logOutUser } from '../../actions/UserActions';


import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';
import Swiper from 'react-native-swiper'

import About from './About';
import { authFetch } from '../../helpers';

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

  componentDidMount() {
    // authFetch('http://a989a625.ngrok.io/api/user', {
    //   method: 'GET',
    // })
    // .then(res => res.json())
    // .then(res => {
    //   // auth-based -- in progress
    //   console.log('-----------------------------')
    //   console.log(res, 'response')
    // })
  }

  handleOnPress() {
    this.props.navigation.navigate('Verify');
  }

  testLogout() {
    this.props.logOutUser();
  }

  render() {
    return (
      <Swiper loop={false}>
        <StyledView>
          <StyledWelcomeView>
            <StyledWelcomeText>Welcome to FLEX Studios!</StyledWelcomeText>
            <StyledGrayText>Swipe to learn more</StyledGrayText>
            <Button title="logouttest" onPress={this.testLogout.bind(this)} />
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

const mapDispatchToProps = {
  logOutUser
} 

export default connect(null, mapDispatchToProps)(LandingPage);
