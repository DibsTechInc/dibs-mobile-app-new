import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
  PROFILE_ROUTE,
} from '../constants/RouteConstants';

import SchedulePage from '../components/SchedulePage';
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
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    [SCHEDULE_ROUTE]: {
      screen: SchedulePage,
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    [PROFILE_ROUTE]: {
      screen: ProfilePage,
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
    [DRAWER_ROUTE]: {
      screen: Drawer,
      navigationOptions: {
        gesturesEnabled: false,
      },
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
    const Nav = createStackNavigator(this.props.user.id);
    return <Nav />;
  }
}

Navigator.propTypes = {
  user: PropTypes.shape(),
};

const mapStateToProps = state => ({
  user: state.user,
});

export default connect(mapStateToProps)(Navigator);
