import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  Button,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import { MAIN_ROUTE } from '../../constants/RouteConstants/index';

import Header from '../Header';
import * as Colors from '../../theme/colors';

class ProfileScreen extends Component {
  constructor() {
    super();
    this.onValueChange = this.onValueChange.bind(this);
    this.state = { switchValue: false, loggedIn: false };
  }

  onValueChange(value) {
    this.setState({ switchValue: value });
  }

  toggleAuthView() {
    this.setState({ toggleAuthView: !this.state.toggleAuthView });
  }

  render() {
    return (
      <View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
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
      </View>
    );
  }
}

ProfileScreen.propTypes = {
  navigation: PropTypes.shape(),
};

ProfileScreen.navigationOptions = ({ navigation }) => ({
  headerRight: (
    <Button onPress={() => (navigation.replace(MAIN_ROUTE))} title="Home" color="darkgray" />
  ),
});

export default ProfileScreen;
