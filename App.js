import React, { Component } from 'react';
import { Provider } from 'react-redux';
import {
  Font,
  ScreenOrientation,
  Asset,
  Updates,
} from 'expo';

import Sentry from 'sentry-expo';
import styled from 'styled-components';

import { AsyncStorage, View, AppState } from 'react-native';
import Promise from 'bluebird';

import { WHITE, EVENT_POLL_INTERVAL } from './app/constants';

import store from './app/store'; // lol App store... - Dylan
import Config from './config.json';
import Navigator from './app/router';
import LinearLoader from './app/components/shared/LinearLoader';
import ErrorPage from './app/components/ErrorPage';
import Modal from './app/components/Modal';

import {
  requestStudioData,
  requestUserData,
  syncUserEvents,
  removeExpiredEvents,
  requestEventData,
  setStudio,
  logFatalError,
  syncUserPasses,
} from './app/actions';
import { getUserIsResettingPassword } from './app/selectors';

// Image imports for caching
import MainPage from './assets/img/main-page.png';
import ActivityGrey from './assets/img/activity-grey.png';
import ActivityWhite from './assets/img/activity-white.png';
import CalendarGrey from './assets/img/calendar-grey.png';
import CalendarWhite from './assets/img/calendar-white.png';
import CartGrey from './assets/img/cart-grey.png';
import CartWhite from './assets/img/cart-white.png';
import MainGrey from './assets/img/main-grey.png';
import Amex from './assets/img/stp_card_amex.png';
import Diners from './assets/img/stp_card_diners.png';
import Discover from './assets/img/stp_card_discover.png';
import JCB from './assets/img/stp_card_jcb.png';
import MasterCard from './assets/img/stp_card_mastercard.png';
import Unknown from './assets/img/stp_card_unknown.png';
import Visa from './assets/img/stp_card_visa.png';
import TrashGrey from './assets/img/trash-grey.png';
import UserGrey from './assets/img/user-grey.png';
import UserWhite from './assets/img/user-white.png';
import FilterWhite from './assets/img/filter-white.png';
import CheckWhite from './assets/img/check-white.png';
import AddToCalendar from './assets/img/add-to-calendar.png';
import MyClassesIcon from './assets/img/my-classes.png';
import ColumnSpotBooking from './assets/img/column-spotbooking.png';
import DoorSpotBooking from './assets/img/door-spotbooking.png';

// Native apps can only load downloaded fronts stored in assets/fonts folder
import StudioFont from './assets/fonts/Regular.ttf';
import StudioFontHeavy from './assets/fonts/Bold.ttf';

// uncomment to test sentry in dev mode
// Sentry.enableInExpoDevelopment = true;

// load up the guardian robot
Sentry.config(Config.SENTRY_DSN).install();

const StyledLoadingPage = styled.View`
  align-items: center;
  background: ${Config.STUDIO_COLOR};
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
      fontLoaded: false,
      imageLoaded: false,
      isReady: false,
      appState: AppState.currentState,
    };
    this.onAppStateChange = this.onAppStateChange.bind(this);

    AppState.addEventListener('change', this.onAppStateChange);
  }
  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    await this.getFonts();
    await Promise.delay(Config.LOADING_QUOTES.length && 2000);
    await this.getImages();
    await this.getAssets();
    this.eventRefreshInterval = setInterval(async () => {
      try {
        const state = store.getState();
        if (
          !(await AsyncStorage.getItem(Config.USER_TOKEN_KEY))
          || !state.user.id
          || !state.studio.data
        ) return;
        store.dispatch(removeExpiredEvents());
        store.dispatch(requestEventData({}, false));
      } catch (err) {
        console.error(err);
        Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      }
    }, EVENT_POLL_INTERVAL);
  }
  /**
   * @param {Object} _ nextProps
   * @param {Object} nextState to be set before update
   * @returns {boolean} if component should re-render
   */
  shouldComponentUpdate(_, nextState) {
    if (nextState.appState !== this.state.appState) return false;
    return true;
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    clearInterval(this.eventRefreshInterval);
    AppState.removeEventListener('change', this.onAppStateChange);
  }
  /**
   * @param {string} nextAppState after it changes
   * @returns {undefined}
   */
  onAppStateChange(nextAppState) {
    if (getUserIsResettingPassword(store.getState())) return;
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.getUpdates();
      this.setState({ fetchedAssets: false }, () => this.getAssets());
    }
    this.setState({ appState: nextAppState });
  }
  /**
   * @returns {undefined}
   */
  async getUpdates() {
    if (__DEV__) return;

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Updates.reload();
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
    }
  }
   /**
   * @returns {undefined}
   */
  async getFonts() {
    await Font.loadAsync({
      'studio-font': StudioFont,
      'studio-font-heavy': StudioFontHeavy,
    });
    this.setState({ fontLoaded: true });
  }
  /**
   * @returns {undefined}
   */
  async getImages() {
    await Asset.loadAsync([
      MainPage,
      ActivityGrey,
      ActivityWhite,
      CalendarGrey,
      CalendarWhite,
      CartGrey,
      CartWhite,
      MainGrey,
      Amex,
      Diners,
      Discover,
      JCB,
      MasterCard,
      Unknown,
      Visa,
      TrashGrey,
      UserGrey,
      UserWhite,
      FilterWhite,
      CheckWhite,
      AddToCalendar,
      MyClassesIcon,
      ColumnSpotBooking,
      DoorSpotBooking,
    ]);

    this.setState({ imageLoaded: true });
  }
  /**
   * @returns {undefined}
   */
  async getAssets() {
    try {
      const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
      let studioData = await AsyncStorage.getItem(Config.STUDIO_DATA_KEY);

      if (studioData && studioData.length) {
        studioData = JSON.parse(studioData);
        store.dispatch(setStudio(studioData));
      } else await store.dispatch(requestStudioData(false));

      if (token) {
        await store.dispatch(requestUserData());
      }

      this.setState({ fetchedAssets: true, userToken: token });
      if (await AsyncStorage.getItem(Config.STUDIO_DATA_KEY)) await store.dispatch(requestStudioData(false));
      if (token) {
        await store.dispatch(syncUserEvents());
        await store.dispatch(syncUserPasses());
      }
    } catch (err) {
      AsyncStorage.clear();
      store.dispatch(logFatalError(err));
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      this.setState({ fetchedAssets: false, errorOccurred: true });
    }
  }
  /**
   * @param {Error} err that was thrown
   * @returns {undefined}
   */
  componentDidCatch(err) {
    console.log(err);
    Sentry.captureException(new Error(err.message), { logger: 'my.module' });
    store.dispatch(logFatalError(err));
    this.setState({ errorOccurred: true });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.state.errorOccurred) {
      return (
        <Provider store={store}>
          <View style={{ flex: 1 }}>
            <ErrorPage />
            <Modal />
          </View>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <View style={{ flex: 1 }}>
          {(this.state.fetchedAssets && this.state.imageLoaded) ? (
            <Navigator userToken={this.state.userToken} />
          ) : (
            <StyledLoadingPage>
              <LinearLoader showQuote={this.state.fontLoaded} />
            </StyledLoadingPage>
          )}
          <Modal />
        </View>
      </Provider>
    );
  }
}

export default App;
