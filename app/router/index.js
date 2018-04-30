import React, { Component } from 'react';
import { connect } from 'react-redux';
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

    const userToken = await AsyncStorage.getItem('STORAGE_KEY');

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
