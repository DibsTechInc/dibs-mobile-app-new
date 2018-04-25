import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});

class AuthPage extends Component {
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  handleOnPress() {
    this.props.navigation.navigate('Profile');
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>This is the auth page where user either enters password or signs up</Text>
        <TextInput placeholder="placeholder field" />
        <Button title="SUBMIT" onPress={this.handleOnPress} />
      </View>
    );
  }
}  

export default AuthPage;
