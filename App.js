import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import {
  StyleSheet,
  Text,
  View,
  Platform,
  NavigatorIOS,
} from 'react-native';

import { SchedulePage, SchedulePageResults } from './app/components/SchedulePage/';
import reducers from './app/reducers';

const App = () => {
  return (
    <Provider store={createStore(reducers)}>
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'Flex Studios Schedule',
          component: SchedulePage,
        }}/>
    </Provider>
  )
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

export default App;
