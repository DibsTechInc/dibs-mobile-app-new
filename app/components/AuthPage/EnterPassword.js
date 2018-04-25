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
    return (
      <View style={styles.container}>
        <Text>Enter your password</Text>
        <TextInput placeholder="password" />
        <Button title="SUBMIT" onPress={this.handleOnPress} />
      </View>
    );
  }
}  

export default EnterPassword;
