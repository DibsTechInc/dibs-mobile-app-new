import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import { StackNavigator } from 'react-navigation';

import { SchedulePage } from '../components/SchedulePage';
import { EnterPassword, EnterEmail, Signup } from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';
import Drawer from '../components/Drawer';

const createStackNavigator = token => StackNavigator(
  {
    Landing: {
      screen: LandingPage,
    },
    Main: {
      screen: MainPage,
    },
    Schedule: {
      screen: SchedulePage,
    },
    Profile: {
      screen: ProfilePage,
    },
    Verify: {
      screen: EnterEmail,
    },
    Login: {
      screen: EnterPassword,
    },
    Register: {
      screen: Signup,
    },
    Drawer: {
      screen: Drawer,
    }
  },
  {
    initialRouteName: token ? 'Drawer' : 'Landing',
    navigationOptions: {
      gesturesEnabled: true,
    },
  },
);

class Navigator extends Component {
  checkAuth = async () => {
    const userToken = await AsyncStorage.getItem('STORAGE_KEY');
    return userToken;
  }
  
  render() {
    const userToken = this.checkAuth();
    const Navigator = createStackNavigator(userToken);

    return <Navigator />
  }
}

export default Navigator;
