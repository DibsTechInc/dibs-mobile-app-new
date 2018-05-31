import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Font, ScreenOrientation, Updates, Asset } from 'expo';
import styled from 'styled-components';
import { AsyncStorage, Alert } from 'react-native';
import Promise from 'bluebird';

import { WHITE, USER_POLL_INTERVAL, EVENT_POLL_INTERVAL } from './app/constants';
import store from './app/store'; // lol App store... - Dylan
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
      fontLoaded: false,
      imageLoaded: false,
      checkedUpdates: false,
    };
  }
  /**
   * @returns {undefined}
   */
  async componentWillMount() {
    await this.getUpdates();
    await this.getFonts();
    await this.getImages();
    await this.getAssets();
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.userPollInterval = setInterval(async () => {
      try {
        const checkToken = async () => Boolean(await AsyncStorage.getItem(Config.USER_TOKEN_KEY));
        if (!(await checkToken())) return;
        await store.dispatch(requestUserData(false));
        if (!(await checkToken())) return;
        await store.dispatch(requestCreditCardInfo(false));
        if (!(await checkToken())) return;
        await store.dispatch(requestUserEvents(false));
      } catch (err) {
        console.error(err);
      }
    }, USER_POLL_INTERVAL);
    this.eventRefreshInterval = setInterval(async () => {
      try {
        store.dispatch(removeExpiredEvents());
        store.dispatch(requestEventData({}, false));
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
    if (!__DEV__) {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Updates.reloadFromCache();
      }
    }

    this.setState({ checkedUpdates: true });
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

      if (studioData) {
        studioData = JSON.parse(studioData);
        store.dispatch(setStudio(studioData));
        store.dispatch(requestStudioData(false)).catch(console.error);
      } else await store.dispatch(requestStudioData(false));

      await Promise.all([
        token && store.dispatch(requestUserData(false)),
        token && store.dispatch(requestCreditCardInfo(false)),
        token && store.dispatch(requestUserEvents(false)),
      ]);

      this.setState({ fetchedAssets: true, userToken: token });
      if (token) await store.dispatch(syncUserEvents());
    } catch (err) {
      AsyncStorage.clear();
      Alert.alert('Something went wrong loading your app. Please close the app and try again.');
      this.setState({ fetchedAssets: false, errorOccurred: true });
      console.log(err);
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.state.errorOccurred || !this.state.fontLoaded) {
      return <StyledLoadingPage />;
    }

    if (this.state.fetchedAssets &&
      this.state.checkedUpdates &&
      this.state.fontLoaded &&
      this.state.imageLoaded) {
      return (
        <Provider store={store}>
          <Navigator userToken={this.state.userToken} />
        </Provider>
      );
    }

    return (
      <StyledLoadingPage>
        <LinearLoader showQuote />
      </StyledLoadingPage>
    );
  }
}

export default App;
