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
} from '../../constants/RouteConstants/index';
import * as Colors from '../../theme/colors';

const styles = {
  container: {
    paddingTop: 20,
    flex: 1
  },
  navItemStyle: {
    padding: 10
  },
  navSectionStyle: {
    backgroundColor: 'lightgrey'
  },
  sectionHeadingStyle: {
    paddingVertical: 10,
    paddingHorizontal: 5
  },
  footerContainer: {
    padding: 20,
    backgroundColor: 'lightgrey'
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
  handleLogout() {
    this.props.logOutUser();
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
