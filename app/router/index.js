import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AsyncStorage } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import Config from '../../config.json';

import {
  LANDING_ROUTE,
  VERIFY_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  DRAWER_ROUTE,
  PASSWORD_RESET_ROUTE,
  SETTINGS_ROUTE,
  TERMS_AND_CONDITIONS_ROUTE,
  EDIT_USERNAME_ROUTE,
  EDIT_PASSWORD_ROUTE,
  EDIT_EMAIL_ROUTE,
  EDIT_CC_ROUTE,
  CLASS_INFO_ROUTE,
} from '../constants/RouteConstants';

import {
  EnterPassword,
  EnterEmail,
  Signup,
  PasswordReset,
  TermsAndConditions,
} from '../components/AuthPage';

import LandingPage from '../components/LandingPage';
import Drawer from '../components/Drawer';

import {
  UserSettings,
  EditUserName,
  EditPassword,
  EditEmail,
  EditCC,
} from '../components/ProfilePage';

import ClassDetail from '../components/MyClasses/ClassDetail';

const stackNav = token => createStackNavigator(
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
    [TERMS_AND_CONDITIONS_ROUTE]: {
      screen: TermsAndConditions,
    },
    [PASSWORD_RESET_ROUTE]: {
      screen: PasswordReset,
    },
    [DRAWER_ROUTE]: {
      screen: Drawer,
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    [SETTINGS_ROUTE]: {
      screen: UserSettings,
    },
    [EDIT_USERNAME_ROUTE]: {
      screen: EditUserName,
    },
    [EDIT_EMAIL_ROUTE]: {
      screen: EditEmail,
    },
    [EDIT_PASSWORD_ROUTE]: {
      screen: EditPassword,
    },
    [EDIT_CC_ROUTE]: {
      screen: EditCC,
    },
    [CLASS_INFO_ROUTE]: {
      screen: ClassDetail,
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
    this.checkAuth = this.checkAuth.bind(this);
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
  async checkAuth() {
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
    const Nav = createAppContainer(stackNav(this.props.userToken));
    return <Nav screenProps={{ isLoading: false }} />;
  }
}

Navigator.propTypes = {
  userToken: PropTypes.string,
};

export default Navigator;
