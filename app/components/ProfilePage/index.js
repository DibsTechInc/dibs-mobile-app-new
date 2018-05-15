import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  Alert,
  Button,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import {
  MAIN_ROUTE,
  PROFILE_INFO_ROUTE,
  ABOUT_ROUTE,
  FAQ_ROUTE,
} from '../../constants/RouteConstants';

import Header from '../Header';
import FadeInView from '../shared/FadeInView';
import { SOFT_GREY } from '../../constants/ColorConstants';

/**
 * @class ProfileScreen
 * @extends Component
 */
class ProfileScreen extends Component {
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
        <Header iconColor={'#000'} backgroundColor={SOFT_GREY} />
        <View style={{ backgroundColor: SOFT_GREY, flex: 1 }}>
          <SettingsList borderColor="#fff" defaultItemSize={50}>
            <SettingsList.Header headerStyle={{ marginTop: 15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title='PERSONAL DETAILS'
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title='John Smith'
              onPress={() => this.props.navigation.navigate(PROFILE_INFO_ROUTE)}
            />
            <SettingsList.Header headerStyle={{ marginTop: 15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title='ACCOUNT DETAILS'
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title='Upcoming Classes'
              onPress={() => Alert.alert('Route To Upcoming Classes Page')}
            />
            <SettingsList.Item
              title='Packages/Credit'
              onPress={() => Alert.alert('Route To Packages/Credits Page')}
            />
            <SettingsList.Item
              title='Settings'
              onPress={() => Alert.alert('Route To Settings Page')}
            />

            <SettingsList.Header headerStyle={{ marginTop:15 }}/>
            <SettingsList.Item
              hasNavArrow={false}
              title='ADDITIONAL'
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title='About'
              onPress={() => this.props.navigation.navigate(ABOUT_ROUTE)}
            />
            <SettingsList.Item
              title='FAQ'
              onPress={() => this.props.navigation.navigate(FAQ_ROUTE)}
            />
            <SettingsList.Item
              title='Contact'
              onPress={() => Alert.alert('Route To Contact Page')}
            />
          </SettingsList>
        </View>
      </FadeInView>
    );
  }
}

ProfileScreen.propTypes = {
  navigation: PropTypes.shape(),
};

export default ProfileScreen;
