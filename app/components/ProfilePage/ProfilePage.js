import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import Sentry from 'sentry-expo';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import SettingsList from 'react-native-settings-list';
import styled from 'styled-components';
import email from 'react-native-email';

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
  TERMS_AND_CONDITIONS_ROUTE,
  DEFAULT_BG,
  GREY,
  LIGHT_GREY,
  WHITE,
} from '../../constants';

import Header from '../Header';
import { FadeInView, SwipableButton } from '../shared';
import {
  getUserFirstName,
  getUserLastName,
  getUserId,
  getUserEmail,
  getStudioName,
} from '../../selectors';
import { logOutUser, enqueueUserError } from '../../actions';
import Config from '../../../config.json';

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

    this.handleOnPressNavStudioTerms = this.handleOnPress.bind(this, TERMS_AND_CONDITIONS_ROUTE, { url: Config.STUDIO_TERMS_LINK });
    this.handleOnPressNavDibsTerms = this.handleOnPress.bind(this, TERMS_AND_CONDITIONS_ROUTE, { url: Config.DIBS_TERMS_LINK });

    this.handleEmail = this.handleEmail.bind(this);
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
   * @param {object} state the state
   * @returns {undefined}
   */
  handleOnPress(route, state) {
    this.props.navigation.navigate(route, state);
  }

  /**
   * @returns {undefined}
   */
  handleEmail() {
    email(Config.STUDIO_EMAIL, {
      // Optional additional arguments
      cc: '', // string or array of email addresses
      bcc: '', // string or array of email addresses
      subject: `User ID ${this.props.userId} Feedback`,
      body: '',
    }).catch((err) => {
      console.log(err);
      Sentry.captureException(new Error(err));
      this.props.enqueueUserError({ title: 'Error!', message: 'Something went wrong opening your mail client' })
    });
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
              title="Personal Details"
              titleStyle={{ color: GREY, fontFamily: 'studio-font-heavy', fontSize: 16 }}
              titleBoxStyle={titleBoxStyle}
            />
            <SettingsList.Item
              title="Name"
              titleInfo={`${this.props.userFirstName} ${this.props.userLastName}`}
              titleInfoStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
              onPress={this.handleEditUsernameRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <SettingsList.Item
              title="Email"
              titleInfo={this.props.email}
              titleInfoStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
              onPress={this.handleEditEmailRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <SettingsList.Item
              title="Password"
              titleInfo="••••"
              titleInfoStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
              onPress={this.handleEditPasswordRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <SettingsList.Header
              headerStyle={{ marginTop: -20 }}
            />
            <SettingsList.Item
              hasNavArrow={false}
              title="Account Details"
              titleStyle={{ color: GREY, fontFamily: 'studio-font-heavy', fontSize: 16 }}
              titleBoxStyle={titleBoxStyle}
            />
            <SettingsList.Item
              title="Payment"
              onPress={this.handleEditCCRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <SettingsList.Item
              title="Additional Settings"
              onPress={this.handleSettingsRoute}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <BottomBuffer />
            <SettingsList.Header
              headerStyle={{ marginTop: -20 }}
            />
            <SettingsList.Item
              hasNavArrow={false}
              title="Contact Us"
              titleStyle={{ color: GREY, fontFamily: 'studio-font-heavy', fontSize: 16 }}
              titleBoxStyle={titleBoxStyle}
            />
            <SettingsList.Item
              title="Feedback"
              onPress={this.handleEmail}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <SettingsList.Header
              headerStyle={{ marginTop: -20 }}
            />
            <SettingsList.Item
              hasNavArrow={false}
              title="Terms & Privacy Policy"
              titleStyle={{ color: GREY, fontFamily: 'studio-font-heavy', fontSize: 16 }}
              titleBoxStyle={titleBoxStyle}
            />
            <SettingsList.Item
              title={this.props.studioName}
              onPress={this.handleOnPressNavStudioTerms}
              titleBoxStyle={titleBoxStyle}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
            <SettingsList.Item
              title="Dibs"
              onPress={this.handleOnPressNavDibsTerms}
              titleBoxStyle={{ ...titleBoxStyle, marginBottom: 7 }}
              titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
            />
          </SettingsList>
          <SwipableButton
            swipeText="Swipe to logout"
            notReadyForPurchase={false}
            onLeftButtonsActivate={this.handleLogout}
          />
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
  userId: PropTypes.number,
  enqueueUserError: PropTypes.func.isRequired,
  studioName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  userLastName: getUserLastName(state),
  email: getUserEmail(state),
  userId: getUserId(state),
  studioName: getStudioName(state),
});

const mapDispatchToProps = {
  logOutUser,
  enqueueUserError,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);

