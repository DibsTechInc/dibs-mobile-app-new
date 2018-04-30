import React, { Component } from 'react';
import { connect } from 'react-redux';
import { AsyncStorage } from 'react-native';
import { StackNavigator } from 'react-navigation';
import Config from '../../config.json';

import {
  LANDING_ROUTE,
  MAIN_ROUTE,
  SCHEDULE_ROUTE,
  VERIFY_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DRAWER_ROUTE,
} from '../constants/RouteConstants';

import { SchedulePage } from '../components/SchedulePage';
import { EnterPassword, EnterEmail, Signup } from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';
import Drawer from '../components/Drawer';

const createStackNavigator = token => StackNavigator(
  {
    [LANDING_ROUTE]: {
      screen: LandingPage,
    },
    [MAIN_ROUTE]: {
      screen: MainPage,
    },
    [SCHEDULE_ROUTE]: {
      screen: SchedulePage,
    },
    [SCHEDULE_ROUTE]: {
      screen: ProfilePage,
    },
    [VERIFY_ROUTE]: {
      screen: EnterEmail,
    },
    [LOGIN_ROUTE]: {
      screen: EnterPassword,
    },
    [REGISTER_ROUTE]: {
      screen: Signup,
    },
    [DRAWER_ROUTE]: {
      screen: Drawer,
    },
  },
  {
    initialRouteName: token ? DRAWER_ROUTE : LANDING_ROUTE,
    navigationOptions: {
      gesturesEnabled: true,
    },
  }
);

class Navigator extends Component {
  constructor() {
    super()

    this.state = {
      attempted: false,
      token: null,
    }
  }

  componentDidUpdate() {
    this.checkAuth();
  }

  checkAuth = async () => {
    if (this.state.attempted) {
      return;
    }

    const userToken = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);

    this.setState({
      token: userToken,
      attempted: true
    });
  }

  render() {
    const Navigator = createStackNavigator(this.props.user.id);

    return <Navigator />
  }
}

const mapStateToProps = state => ({
  user: state.user,
});

export default connect(mapStateToProps)(Navigator);
