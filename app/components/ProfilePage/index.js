import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  Alert,
  Button,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import { MAIN_ROUTE } from '../../constants/RouteConstants/index';

import Header from '../Header';
import FadeInView from '../shared/FadeInView';

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
      <FadeInView style={{ backgroundColor: '#EFEFF4' }}>
        <Header navigation={this.props.navigation} iconColor={'#000'} backgroundColor={'#EFEFF4'} />
        <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
          <SettingsList borderColor="#fff" defaultItemSize={50}>
            <SettingsList.Header headerStyle={{ marginTop: 15 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title='PERSONAL DETAILS'
              titleStyle={{ color: 'darkgray' }}
            />
            <SettingsList.Item
              title='John Smith'
              onPress={() => Alert.alert('Route To Personal Settings')}
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
              title='Transaction History'
              onPress={() => Alert.alert('Route To Transaction History Page')}
            />
            <SettingsList.Item
              title='Packages/Credit'
              onPress={() => Alert.alert('Route To Packages/Credits Page')}
            />
            <SettingsList.Item
              title='Refer a Friend Program'
              onPress={() => Alert.alert('Route To RAF Page')}
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
              onPress={() => Alert.alert('Route To About Page')}
            />
            <SettingsList.Item
              title='FAQ'
              onPress={() => Alert.alert('Route To FAQ Page')}
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
