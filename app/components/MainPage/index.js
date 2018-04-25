
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});

class MainPage extends Component {
  constructor() {
    super();

    this.handleOnPressSchedule = this.handleOnPress.bind(this, 'Schedule');
    this.handleOnPressProfile = this.handleOnPress.bind(this, 'Profile');
  }

  handleOnPress(route) {
    this.props.navigation.navigate(route);
  }

  render() {
    return (
      <View style={styles.container}>
        <Button title="Click here to view Schedule" accessibilityLabel="Schedule" onPress={this.handleOnPressSchedule} />
        <Button title="Click here to view Profile" accessibilityLabel="Profile" onPress={this.handleOnPressProfile} />   
      </View>
    );
  }
} 

export default MainPage;
