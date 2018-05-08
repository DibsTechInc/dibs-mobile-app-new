
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  AsyncStorage,
} from 'react-native';

import styled from 'styled-components';
import Swiper from 'react-native-swiper';

import About from './About';
import { VERIFY_ROUTE } from '../../constants/RouteConstants/index';
import Config from '../../../config.json';
import FadeInView from '../shared/FadeInView';
import { FlexCenter } from '../styled';
import MaterialButton from '../shared/MaterialButton';

const StyledView = styled.View`
  flex: 1;
`;

const StyledButtonsView = StyledView.extend`
  align-items: center;
`;

const StyledWelcomeView = FlexCenter.extend`
  flex: 5;
`;

const StyledWelcomeText = styled.Text`
  font-family: 'flex-font';
  font-size: 14px;
`;

const StyledGrayText = StyledWelcomeText.extend`
  color: #b1b1b1;
`;

/**
 * @class LandingPage
 * @extends Component
 */
class LandingPage extends Component {
  /**
   * @constructor
   * @constructs LandingPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.checkAuth();
    this.handleOnPress = this.handleOnPress.bind(this);
  }
  /**
   * @returns {undefined}
   */
  handleOnPress() {
    this.props.navigation.navigate(VERIFY_ROUTE);
  }
  /**
   * @returns {undefined}
   */
  async checkAuth() {
    const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
    if (token) {
      this.props.navigation.navigate('Drawer');
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Swiper loop={false}>
        <FadeInView style={{ flex: 1 }}>
          <StyledWelcomeView>
            <StyledWelcomeText>Welcome to FLEX Studios!</StyledWelcomeText>
            <StyledGrayText>Swipe to learn more</StyledGrayText>
          </StyledWelcomeView>
          <StyledButtonsView>
            <MaterialButton
              onPress={this.handleOnPress}
              text="Continue"
              style={{ width: '75%', height: 40 }}
            />
          </StyledButtonsView>
        </FadeInView>
        <About />
      </Swiper>
    );
  }
}

LandingPage.propTypes = {
  navigation: PropTypes.shape(),
};

LandingPage.navigationOptions = {
  headerMode: 'none',
};

export default LandingPage;
