import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  View,
  Alert,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import {
  PROFILE_INFO_ROUTE,
  ABOUT_ROUTE,
  FAQ_ROUTE,
  CONTACT_ROUTE,
  SETTINGS_ROUTE,
} from '../../constants/RouteConstants';

import Header from '../Header';
import FadeInView from '../shared/FadeInView';
import { SOFT_GREY, BLACK } from '../../constants/ColorConstants';
import { getUserFirstName, getUserLastName } from '../../selectors';

/**
 * @class ProfileScreen
 * @extends Component
 */
class ProfilePage extends Component {
  /**
   * @constructor
   * @constructs ProfileScreen
   * @param {Object} props for component
   */
  constructor() {
    super();
    this.state = { switchValue: false, loggedIn: false };
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ backgroundColor: SOFT_GREY }}>
        <Header title="My Account" />
        <View style={{ backgroundColor: SOFT_GREY, flex: 1 }}>
          <SettingsList borderColor="#fff" defaultItemSize={50}>
            <SettingsList.Header headerStyle={{ marginTop: 15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="PERSONAL DETAILS"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title={`${this.props.userFirstName} ${this.props.userLastName}`}
              onPress={() => this.props.navigation.navigate(PROFILE_INFO_ROUTE)}
            />
            <SettingsList.Header headerStyle={{ marginTop: 15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="ACCOUNT DETAILS"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title="Settings"
              onPress={() => this.props.navigation.navigate(SETTINGS_ROUTE)}
            />

            <SettingsList.Header headerStyle={{ marginTop: 15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="ADDITIONAL"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title="About"
              onPress={() => this.props.navigation.navigate(ABOUT_ROUTE)}
            />
            <SettingsList.Item
              title="FAQ"
              onPress={() => this.props.navigation.navigate(FAQ_ROUTE)}
            />
            <SettingsList.Item
              title="Contact"
              onPress={() => this.props.navigation.navigate(CONTACT_ROUTE)}
            />
          </SettingsList>
        </View>
      </FadeInView>
    );
  }
}

ProfilePage.propTypes = {
  navigation: PropTypes.shape().isRequired,
  userFirstName: PropTypes.string.isRequired,
  userLastName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  userLastName: getUserLastName(state),
});

export default connect(mapStateToProps)(ProfilePage);
