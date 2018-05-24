import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  View,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import {
  ABOUT_ROUTE,
  FAQ_ROUTE,
  CONTACT_ROUTE,
  SETTINGS_ROUTE,
  LANDING_ROUTE,
  EDIT_USERNAME_ROUTE,
  EDIT_PASSWORD_ROUTE,
  EDIT_EMAIL_ROUTE,
  EDIT_CC_ROUTE,
} from '../../constants/RouteConstants';

import Header from '../Header';
import { FadeInView } from '../shared';
import { SOFT_GREY, WHITE } from '../../constants/ColorConstants';
import {
  getUserFirstName,
  getUserLastName,
  getUserEmail,
  getCCLastFour,
} from '../../selectors';
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
    this.handleEditUsernameRoute = this.handleOnPress.bind(this, EDIT_USERNAME_ROUTE);

    this.handleEditPasswordRoute = this.handleOnPress.bind(this, EDIT_PASSWORD_ROUTE);
    this.handleEditEmailRoute = this.handleOnPress.bind(this, EDIT_EMAIL_ROUTE);

    this.handleEditCCRoute = this.handleOnPress.bind(this, EDIT_CC_ROUTE);

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
          <SettingsList borderColor={WHITE} defaultItemSize={50}>
            <SettingsList.Header headerStyle={{ marginTop: -20 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="PERSONAL DETAILS"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title="Name"
              titleInfo={`${this.props.userFirstName} ${this.props.userLastName}`}
              onPress={this.handleEditUsernameRoute}
            />
            <SettingsList.Item
              title="Email"
              titleInfo={this.props.email}
              onPress={this.handleEditEmailRoute}
            />
            <SettingsList.Item
              title="Password"
              titleInfo="••••"
              onPress={this.handleEditPasswordRoute}
            />
            <SettingsList.Item
              title="Payment"
              titleInfo={this.props.ccLastFour}
              onPress={this.handleEditCCRoute}
            />
            <SettingsList.Header headerStyle={{ marginTop: -20 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="ACCOUNT DETAILS"
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title="Settings"
              onPress={this.handleSettingsRoute}
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
  email: PropTypes.string.isRequired,
  ccLastFour: PropTypes.string,
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  userLastName: getUserLastName(state),
  email: getUserEmail(state),
  ccLastFour: getCCLastFour(state),
});

const mapDispatchToProps = {
  logOutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);
