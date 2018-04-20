import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { Font } from 'expo';
import thunk from 'redux-thunk';

import {
  StyleSheet,
  Text,
  View,
  Platform,
  NavigatorIOS,
} from 'react-native';

// TODO: App Entry will obviously not be schedule page - will change later
import { SchedulePage } from './app/components/SchedulePage/';
import reducers from './app/reducers';

// Native apps can only load downloaded fronts stored in assets/fonts folder
import SourceSansProBold from './assets/fonts/SourceSansPro-Bold.ttf';
import SourceSansProRegular from './assets/fonts/SourceSansPro-Regular.ttf';

const configuredStore = createStore(reducers, applyMiddleware(thunk));

class App extends Component {

  componentDidMount() {
    Font.loadAsync({
      'flex-font': SourceSansProRegular,
      'flex-font-heavy': SourceSansProBold,
    });
  }

  render() {
    return (
      <Provider store={configuredStore}>
        <NavigatorIOS
          style={styles.container}
          initialRoute={{
            title: '',
            component: SchedulePage,
          }}/>
      </Provider>
    )
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

export default App;
