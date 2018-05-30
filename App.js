import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Font, ScreenOrientation, Updates } from 'expo';
import styled from 'styled-components';
import { AsyncStorage } from 'react-native';
import Promise from 'bluebird';

import { WHITE, USER_POLL_INTERVAL, EVENT_POLL_INTERVAL } from './app/constants';
import store from './app/store'; // lol App store...
import Config from './config.json';
import Navigator from './app/router';
import LinearLoader from './app/components/shared/LinearLoader';
import {
  requestStudioData,
  requestUserData,
  requestCreditCardInfo,
  requestUserEvents,
  syncUserEvents,
  removeExpiredEvents,
  requestEventData,
  setStudio,
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
      loadedFont: false,
    };
  }
  /**
   * @returns {undefined}
   */
  componentWillMount() {
    this.getUpdates();
    this.getFonts();
    this.getAssets();
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.userPollInterval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
        if (!token) return;
        store.dispatch(requestUserData());
        store.dispatch(requestCreditCardInfo());
        store.dispatch(requestUserEvents());
      } catch (err) {
        console.error(err);
      }
    }, USER_POLL_INTERVAL);
    this.eventRefreshInterval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
        if (!token) return;
        store.dispatch(removeExpiredEvents());
        store.dispatch(requestEventData());
      } catch (err) {
        console.error(err);
      }
    }, EVENT_POLL_INTERVAL);
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    clearInterval(this.userPollInterval);
    clearInterval(this.eventRefreshInterval);
  }
  /**
   * @returns {undefined}
   */
  async getUpdates() {
    if (__DEV__) {
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Updates.reload();
      }
    } catch (err) {
      console.log(err);
    }
  }
/**
   * @returns {undefined}
   */
  async getFonts() {
    await Font.loadAsync({
      'flex-font': SourceSansProRegular,
      'flex-font-heavy': SourceSansProBold,
    });
    this.setState({ fontLoaded: true });
  }
  /**
   * @returns {undefined}
   */
  async getAssets() {
    try {
      const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
      let studioData = await AsyncStorage.getItem(Config.STUDIO_DATA_KEY);
      studioData = JSON.parse(studioData);

      if (studioData) {
        store.dispatch(setStudio(studioData));
        store.dispatch(requestStudioData());
      } else await store.dispatch(requestStudioData());

      await Promise.all([
        token && store.dispatch(requestUserData()),
        token && store.dispatch(requestCreditCardInfo()),
        token && store.dispatch(requestUserEvents()),
      ]);

      this.setState({ fetchedAssets: true, userToken: token });
      if (token) await store.dispatch(syncUserEvents());
    } catch (err) {
      this.setState({ fetchedAssets: false, errorOccurred: true });
      Updates.reload();
      console.log(err);
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Provider store={store}>
        {(this.state.fetchedAssets) ? (
          <Navigator userToken={this.state.userToken} />
        ) : (
          <StyledLoadingPage>
            {(this.state.errorOccurred || !this.state.fontLoaded) ? null : <LinearLoader showQuote />}
          </StyledLoadingPage>
        )}
      </Provider>
    );
  }
}

export default App;
