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

class EnterPassword extends Component {
  constructor() {
    super();

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  handleOnPress() {
    this.props.navigation.navigate('Main');
  }

  render() {
    console.log(this.props, '??')
    return (
      <View style={styles.container}>
        <Text>Welcome!</Text>
        <Text>Just need a few details before we get started:</Text>
        <TextInput placeholder="person@email.com" />
        <TextInput placeholder="Full name" />
        <TextInput placeholder="Password" />
        <Button title="SIGNUP" onPress={this.handleOnPress} />
      </View>
    );
  }
}  

export default EnterPassword;
