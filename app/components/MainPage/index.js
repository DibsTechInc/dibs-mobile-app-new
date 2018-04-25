
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

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${lightenDarkenColor('#8dc63f', 30)};
`;

class MainPage extends Component {
  constructor() {
    super();

    this.handleOnPressSchedule = this.handleOnPress.bind(this, 'Schedule');
    this.handleOnPressProfile = this.handleOnPress.bind(this, 'Profile');
  }

  handleOnPress(route) {
    this.props.navigation.navigate(route);
  }

  render() {
    return (
      <StyledView>
        <Button color="black" title="Click here to view Schedule" accessibilityLabel="Schedule" onPress={this.handleOnPressSchedule} />
        <Button color="black" title="Click here to view Profile" accessibilityLabel="Profile" onPress={this.handleOnPressProfile} />   
      </StyledView>
    );
  }
}

export default MainPage;
