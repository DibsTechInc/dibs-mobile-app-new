import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  View,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import styled from 'styled-components';

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
  DEFAULT_BG,
  GREY,
  LIGHT_GREY,
  WHITE,
} from '../../constants';

import Header from '../Header';
import { FadeInView } from '../shared';
import {
  getUserFirstName,
  getUserLastName,
  getUserEmail,
} from '../../selectors';
import { logOutUser } from '../../actions';

const BottomBuffer = styled.View`
  background-color: ${WHITE};
  bottom: -1;
  height: 1;
  left: 0;
  position: absolute;
  right: 0;
`;

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
    await this.props.logOutUser();
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
    const titleBoxStyle = {
      backgroundColor: WHITE,
      flex: 1,
      marginLeft: 15,
      flexDirection: 'row',
      minHeight: 50,
    };
    return (
      <FadeInView style={{ backgroundColor: DEFAULT_BG }}>
        <Header title="My Account" />
        <View style={{ backgroundColor: DEFAULT_BG, flex: 1 }}>
          <SettingsList backgroundColor={WHITE} borderColor={LIGHT_GREY} defaultItemSize={50}>
            <SettingsList.Header headerStyle={{ marginTop: -20 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="PERSONAL DETAILS"
              titleStyle={{ color: GREY, fontFamily: 'flex-font-heavy', fontSize: 14 }}
              titleBoxStyle={titleBoxStyle}
            />
            <SettingsList.Item
              title="Name"
              titleInfo={`${this.props.userFirstName} ${this.props.userLastName}`}
              onPress={this.handleEditUsernameRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'flex-font', fontSize: 14 }}
            />
            <SettingsList.Item
              title="Email"
              titleInfo={this.props.email}
              onPress={this.handleEditEmailRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'flex-font', fontSize: 14 }}
            />
            <SettingsList.Item
              title="Password"
              titleInfo="••••"
              onPress={this.handleEditPasswordRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'flex-font', fontSize: 14 }}
            />
            <SettingsList.Header
              headerStyle={{ marginTop: -20 }}
            />
            <SettingsList.Item
              hasNavArrow={false}
              title="ACCOUNT DETAILS"
              titleStyle={{ color: GREY, fontFamily: 'flex-font-heavy', fontSize: 14 }}
              titleBoxStyle={titleBoxStyle}
            />
            <SettingsList.Item
              title="Payment"
              onPress={this.handleEditCCRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'flex-font', fontSize: 14 }}
            />
            <SettingsList.Item
              title="Settings"
              onPress={this.handleSettingsRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'flex-font', fontSize: 14 }}
            />
            <SettingsList.Item
              hasNavArrow={false}
              title="Logout"
              onPress={this.handleLogout}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'flex-font', fontSize: 14 }}
            />
            <BottomBuffer />
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
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  userLastName: getUserLastName(state),
  email: getUserEmail(state),
});

const mapDispatchToProps = {
  logOutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);
