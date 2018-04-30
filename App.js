import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Font } from 'expo';
import store from './app/store'; // lol App store...
import Navigator from './app/router';

// Native apps can only load downloaded fronts stored in assets/fonts folder
import SourceSansProBold from './assets/fonts/SourceSansPro-Bold.ttf';
import SourceSansProRegular from './assets/fonts/SourceSansPro-Regular.ttf';

class App extends Component {
  constructor() {
    super();

    this.state = {
      fontsLoaded: false,
    }
  }

  componentWillMount() {
    this.getFonts();
  }

  async getFonts() {
    await Font.loadAsync({
      'flex-font': SourceSansProRegular,
      'flex-font-heavy': SourceSansProBold,
    });

    this.setState({
      fontsLoaded: true,
    });
  }

  render() {
    if (!this.state.fontsLoaded) {
      return null;
    }

    return (
      <Provider store={store}>
        <Navigator />
      </Provider>
    )
  }
}

export default App;
