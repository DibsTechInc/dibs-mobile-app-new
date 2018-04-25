import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { Font } from 'expo';
import thunk from 'redux-thunk';
// import { StackNavigator } from 'react-navigation';

// TODO: App Entry will obviously not be schedule page - will change later
import reducers from './app/reducers';
// import { SchedulePage } from './app/components/SchedulePage';
import Router from './app/router';

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
        <Router />
      </Provider>
    )
  }
}

export default App;
