import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  Platform,
  NavigatorIOS,
} from 'react-native';

import SchedulePage from './SchedulePage';

export default class App extends React.Component {
  render() {
    console.log('rendered?')
    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'Flex Studios Schedule',
          component: SchedulePage,
        }}/>
    );
  }
}

const styles = StyleSheet.create({
  description: {
    fontSize: 18,
    textAlign: 'center',
    color: '#656565',
    marginTop: 65,
  },
  container: {
    flex: 1,
  },
});
