import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { Font } from 'expo';
import { thunk, navigation } from './app/utils/redux';

import {
  StyleSheet,
  Text,
  View,
  Platform,
  NavigatorIOS,
} from 'react-native';

// TODO: App Entry will obviously not be schedule page - will change later
import AppWithNavigationState from './app/navigators/AppNavigator';
import reducers from './app/reducers';

// Native apps can only load downloaded fronts stored in assets/fonts folder
import SourceSansProBold from './assets/fonts/SourceSansPro-Bold.ttf';
import SourceSansProRegular from './assets/fonts/SourceSansPro-Regular.ttf';

const configuredStore = createStore(reducers, applyMiddleware(thunk, navigation));

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
        <AppWithNavigationState />
      </Provider>
    )
  }
}

export default App;
