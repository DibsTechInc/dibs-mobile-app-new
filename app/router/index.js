import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AsyncStorage } from 'react-native';
import { StackNavigator } from 'react-navigation';
import Config from '../../config.json';

import {
  LANDING_ROUTE,
  VERIFY_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DRAWER_ROUTE,
  PROFILE_INFO_ROUTE,
  PASSWORD_RESET_ROUTE,
  ABOUT_ROUTE,
} from '../constants/RouteConstants';

import { EnterPassword, EnterEmail, Signup, PasswordReset } from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import Drawer from '../components/Drawer';
import ProfileInfo from '../components/ProfilePage/ProfileInfo';
import AboutPage from '../components/AboutPage';

const createStackNavigator = token => StackNavigator(
  {
    [LANDING_ROUTE]: {
      screen: LandingPage,
      navigationOptions: {
        gesturesEnabled: false,
      },
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
    [PASSWORD_RESET_ROUTE]: {
      screen: PasswordReset,
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    [DRAWER_ROUTE]: {
      screen: Drawer,
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    [PROFILE_INFO_ROUTE]: {
      screen: ProfileInfo,
    },
    [ABOUT_ROUTE]: {
      screen: AboutPage,
    },
  },
  {
    headerMode: 'none',
    initialRouteName: token ? DRAWER_ROUTE : LANDING_ROUTE,
    navigationOptions: {
      gesturesEnabled: true,
    },
  }
);

/**
 * @class Navigator
 * @extends Component
 */
class Navigator extends Component {
  /**
   * @constructor
   * @constructs Navigator
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      attempted: false,
      token: null,
    };
  }
  /**
   * @returns {undefined}
   */
  componentDidUpdate() {
    this.checkAuth();
  }
  /**
   * @returns {undefined}
   */
  checkAuth = async () => {
    if (this.state.attempted) {
      return;
    }
    this.setState({
      token: await AsyncStorage.getItem(Config.USER_TOKEN_KEY),
      attempted: true,
    });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const Nav = createStackNavigator(this.props.userToken);
    return <Nav />;
  }
}

Navigator.propTypes = {
  userToken: PropTypes.string,
};


export default Navigator;
