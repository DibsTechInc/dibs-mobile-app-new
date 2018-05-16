import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Font } from 'expo';
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
    this.state = {
      fetchedAssets: false,
      userToken: null,
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
    const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
    await new Promise(res => store.dispatch(requestStudioData(res)));
    await Promise.all([
      Font.loadAsync({
        'flex-font': SourceSansProRegular,
        'flex-font-heavy': SourceSansProBold,
      }),
      token && new Promise(res => store.dispatch(requestUserData(res))),
      token && new Promise(res => store.dispatch(requestCreditCardInfo(res))),
      token && new Promise(res => store.dispatch(requestUserEvents(true, res))),
    ]);
    this.setState({ fetchedAssets: true, userToken: token });
    if (token) await new Promise(res => store.dispatch(syncUserEvents(res)));
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
            <DibsLoader />
          </StyledLoadingPage>
        )}
      </Provider>
    );
  }
}

export default App;
