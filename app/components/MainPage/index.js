
import React, { Component } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';
import { lightenDarkenColor } from '../../helpers';
import CalendarPage from './CalendarPage';

const StyledView = styled.View`
  flex: 1;
  background-color: ${lightenDarkenColor('#8dc63f', 30)};
`;

const StyledInnerView = styled.View`
  margin-top: 80;
`;

class MainPage extends Component {
  constructor() {
    super();

    this.handleOnPressSchedule = this.handleOnPress.bind(this, 'Schedule');
    this.handleOnPressProfile = this.handleOnPress.bind(this, 'Profile');
    this.handleOnPressLanding = this.handleOnPress.bind(this, 'Landing');
  }

  handleOnPress(route) {
    this.props.navigation.navigate(route);
  }

  render() {
    return (
      <StyledView>
        <CalendarPage />
        <StyledInnerView>
          <Button onPress={this.handleOnPressSchedule} title='Buy class' color='black' />
          <Button onPress={this.handleOnPressProfile} title='Profile Settings' color='black' />
          <Button onPress={this.handleOnPressLanding} title='Logout' color='black' />
        </StyledInnerView>
      </StyledView>
    );
  }
}

MainPage.navigationOptions = {
  gesturesEnabled: false,
}

export default MainPage;
