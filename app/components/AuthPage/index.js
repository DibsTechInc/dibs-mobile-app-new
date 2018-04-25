import React from 'react';
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

const AuthPage = () => (
  <View style={styles.container}>
    <Text>This is the auth page</Text>
  </View>
);

AuthPage.navigationOptions = {
  title: 'Register/Login',
};

export default AuthPage;
