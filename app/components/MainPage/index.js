
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { logOutUser } from '../../actions/UserActions';

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
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    console.log(this.props, 'in mounted')
  }

  handleOnPress(route) {
    this.props.navigation.navigate(route);
  }

  handleLogout() {
    console.log(this.props, 'props')
    this.props.logOutUser(() => {
      this.props.navigation.navigate('Landing');
    });
  }

  render() {
    return (
      <StyledView>
        <CalendarPage />
        <StyledInnerView>
          <Button onPress={this.handleOnPressSchedule} title='Buy class' color='black' />
          <Button onPress={this.handleOnPressProfile} title='Profile Settings' color='black' />
          <Button onPress={this.handleLogout} title='Logout' color='black' />
        </StyledInnerView>
      </StyledView>
    );
  }
}

// proptypes and selectors

MainPage.navigationOptions = {
  gesturesEnabled: false,
}

const mapDispatchToProps = {
  logOutUser,
}

export default connect(null, mapDispatchToProps)(MainPage);
