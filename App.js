import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Font, ScreenOrientation, Updates } from 'expo';
import styled from 'styled-components';
import { AsyncStorage } from 'react-native';
import Promise from 'bluebird';

import { WHITE } from './app/constants';
import store from './app/store'; // lol App store...
import Config from './config.json';
import Navigator from './app/router';
import DibsLoader from './app/components/shared/DibsLoader';
import {
  requestStudioData,
  requestUserData,
  requestCreditCardInfo,
  requestUserEvents,
  syncUserEvents,
} from './app/actions';

// Native apps can only load downloaded fronts stored in assets/fonts folder
import SourceSansProBold from './assets/fonts/SourceSansPro-Bold.ttf';
import SourceSansProRegular from './assets/fonts/SourceSansPro-Regular.ttf';

const StyledLoadingPage = styled.View`
  align-items: center;
  background: ${Config.STUDIO_COLOR};
  color ${WHITE};
  justify-content: center;
  flex: 5;
`;

/**
 * @class App
 * @extends Component
 */
class App extends Component {
  /**
   * @constructor
   * @constructs App
   */
  constructor() {
    super();

    ScreenOrientation.allow(ScreenOrientation.Orientation.PORTRAIT);

    this.state = {
      fetchedAssets: false,
      userToken: null,
      errorOccurred: false,
    };
  }
  /**
   * @returns {undefined}
   */
  componentWillMount() {
    this.getAssets();
  }

  /**
   * @returns {undefined}
   */
  async getAssets() {
    try {
      if (process.env.NODE_ENV === 'production') {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // ... notify user of update ...
          Updates.reloadFromCache();
        }
      }

      const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
      await Promise.promisify(cb => store.dispatch(requestStudioData(cb)))();
      await Promise.all([
        Font.loadAsync({
          'flex-font': SourceSansProRegular,
          'flex-font-heavy': SourceSansProBold,
        }),
        token && Promise.promisify(cb => store.dispatch(requestUserData(cb)))(),
        token && new Promise(res => store.dispatch(requestCreditCardInfo(res))),
        token && new Promise(res => store.dispatch(requestUserEvents(res))),
      ]);

      this.setState({ fetchedAssets: true, userToken: token });
      if (token) await new Promise(res => store.dispatch(syncUserEvents(res)));
    } catch (err) {
      this.setState({ fetchingAssets: false, errorOccurred: true });
      console.log(err);
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Provider store={store}>
        {this.state.fetchedAssets ? (
          <Navigator userToken={this.state.userToken} />
        ) : (
          <StyledLoadingPage>
            {this.state.errorOccurred ? null : <DibsLoader />}
          </StyledLoadingPage>
        )}
      </Provider>
    );
  }
}

export default App;
