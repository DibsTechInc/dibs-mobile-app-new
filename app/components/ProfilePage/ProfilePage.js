import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  View,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import {
  PROFILE_INFO_ROUTE,
  ABOUT_ROUTE,
  FAQ_ROUTE,
  CONTACT_ROUTE,
  SETTINGS_ROUTE,
  LANDING_ROUTE,
} from '../../constants/RouteConstants';

import Header from '../Header';
import FadeInView from '../shared/FadeInView';
import { SOFT_GREY } from '../../constants/ColorConstants';
import { getUserFirstName, getUserLastName } from '../../selectors';
import { logOutUser } from '../../actions';

/**
 * @class ProfileScreen
 * @extends Component
 */
class ProfilePage extends PureComponent {
  /**
   * @constructor
   * @constructs ProfileScreen
   * @param {Object} props for component
   */
  constructor() {
    super();
    this.state = { switchValue: false, loggedIn: false };
    this.handleLogout = this.handleLogout.bind(this);
    this.handleProfileInfoRoute = this.handleOnPress.bind(this, PROFILE_INFO_ROUTE);
    this.handleSettingsRoute = this.handleOnPress.bind(this, SETTINGS_ROUTE);
    this.handleAboutRoute = this.handleOnPress.bind(this, ABOUT_ROUTE);
    this.handleFAQRoute = this.handleOnPress.bind(this, FAQ_ROUTE);
    this.handleContactRoute = this.handleOnPress.bind(this, CONTACT_ROUTE);
  }
  /**
   * @returns {undefined}
   */
  async handleLogout() {
    await new Promise(res => this.props.logOutUser(res));
    this.props.navigation.navigate(LANDING_ROUTE);
  }
  /**
   * @param {string} route the route constant
   * @returns {undefined}
   */
  handleOnPress(route) {
    this.props.navigation.navigate(route);
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
            <SettingsList.Header headerStyle={{ marginTop: -20 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="PERSONAL DETAILS"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title={`${this.props.userFirstName} ${this.props.userLastName}`}
              onPress={this.handleProfileInfoRoute}
            />
            <SettingsList.Header headerStyle={{ marginTop: -15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="ACCOUNT DETAILS"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title="Settings"
              onPress={this.handleSettingsRoute}
            />
            <SettingsList.Header headerStyle={{ marginTop: -15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="ADDITIONAL"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title="About"
              onPress={this.handleAboutRoute}
            />
            <SettingsList.Item
              title="FAQ"
              onPress={this.handleFAQRoute}
            />
            <SettingsList.Item
              title="Contact"
              onPress={this.handleContactRoute}
            />
            <SettingsList.Header headerStyle={{ marginTop: -15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="MISC"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              hasNavArrow={false}
              title="Logout"
              onPress={this.handleLogout}
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
  logOutUser: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  userLastName: getUserLastName(state),
});

const mapDispatchToProps = {
  logOutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);
