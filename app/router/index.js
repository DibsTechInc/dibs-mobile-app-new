import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
  PROFILE_ROUTE,
  CART_ROUTE,
  CONFIRMATION_ROUTE,
} from '../constants/RouteConstants';

import SchedulePage from '../components/SchedulePage';
import { EnterPassword, EnterEmail, Signup } from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';
import Drawer from '../components/Drawer';
import CartPage from '../components/CartPage';
import ConfirmationPage from '../components/ConfirmationPage';

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
    [CART_ROUTE]: {
      screen: CartPage,
    },
    [CONFIRMATION_ROUTE]: {
      screen: ConfirmationPage,
    },
    [PROFILE_ROUTE]: {
      screen: ProfilePage,
    },
    [VERIFY_ROUTE]: {
      screen: EnterEmail,
      navigationOptions: {
        gesturesEnabled: true,
      },
    },
    [LOGIN_ROUTE]: {
      screen: EnterPassword,
      navigationOptions: {
        gesturesEnabled: true,
      },
    },
    [REGISTER_ROUTE]: {
      screen: Signup,
    },
    [DRAWER_ROUTE]: {
      screen: Drawer,
    },
  },
  {
    headerMode: 'none',
    initialRouteName: token ? DRAWER_ROUTE : LANDING_ROUTE,
    navigationOptions: {
      gesturesEnabled: false,
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
