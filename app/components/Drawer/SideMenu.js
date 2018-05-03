import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { ScrollView, Text, View } from 'react-native';

import { logOutUser } from '../../actions';
import {
  MAIN_ROUTE,
  PROFILE_ROUTE,
  SCHEDULE_ROUTE,
  CART_ROUTE,
  LANDING_ROUTE,
} from '../../constants/RouteConstants/index';

const styles = {
  container: {
    paddingTop: 20,
    flex: 1,
  },
  navItemStyle: {
    padding: 10,
  },
  navSectionStyle: {
    backgroundColor: 'lightgrey',
  },
  sectionHeadingStyle: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  footerContainer: {
    padding: 20,
    backgroundColor: 'lightgrey',
  }
};

class SideMenu extends Component {
  constructor() {
    super();

    this.handleLogout = this.handleLogout.bind(this);
  }

  navigateToScreen = route => () => {
    const navigateAction = NavigationActions.navigate({
      routeName: route,
    });
    this.props.navigation.dispatch(navigateAction);
  }

   /**
   * @returns {undefined}
   */
  async handleLogout() {
    console.log('pressed?')
    await new Promise(res => this.props.logOutUser(res));
    this.props.navigation.navigate(LANDING_ROUTE);
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View>
            <Text style={styles.sectionHeadingStyle}>
              Section 1
            </Text>
            <View style={styles.navSectionStyle}>
              <Text style={styles.navItemStyle} onPress={this.navigateToScreen(MAIN_ROUTE)}>
                Home
              </Text>
            </View>
            <View style={styles.navSectionStyle}>
              <Text style={styles.navItemStyle} onPress={this.navigateToScreen(CART_ROUTE)}>
                Cart
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.sectionHeadingStyle}>
              Section 2
            </Text>
            <View style={styles.navSectionStyle}>
              <Text style={styles.navItemStyle} onPress={this.navigateToScreen(PROFILE_ROUTE)}>
                Settings
              </Text>
              <Text style={styles.navItemStyle} onPress={this.navigateToScreen(SCHEDULE_ROUTE)}>
                Classes
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.sectionHeadingStyle}>
              Section 3
            </Text>
            <View style={styles.navSectionStyle}>
              <Text style={styles.navItemStyle} onPress={this.handleLogout}>
                Logout
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footerContainer}>
          <Text>This is my fixed footer</Text>
        </View>
      </View>
    );
  }
}

SideMenu.propTypes = {
  navigation: PropTypes.shape(),
  logOutUser: PropTypes.func,
};

const mapDispatchToProps = {
  logOutUser,
};

export default connect(null, mapDispatchToProps)(SideMenu);
