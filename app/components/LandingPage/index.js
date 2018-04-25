
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

class LandingPage extends Component {
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  handleOnPress() {
    this.props.navigation.navigate('Login');
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Welcome to FLEX Studios!</Text>
        <Text>To login or create an account, please enter your email address</Text>
        <TextInput placeholder="email address" />
        <Button title="SUBMIT" accessibilityLabel="SUBMIT" onPress={this.handleOnPress} />
      </View>
    );
  }
} 

export default LandingPage;
