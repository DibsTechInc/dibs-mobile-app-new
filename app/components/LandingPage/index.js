
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import {
  AsyncStorage,
  View,
} from 'react-native';

import styled from 'styled-components';
import Swiper from 'react-native-swiper';

import About from './About';
import { VERIFY_ROUTE, DARK_TEXT_GREY } from '../../constants';

import Config from '../../../config.json';
import { FadeInView, CustomStatusBar, MaterialButton } from '../shared';
import { FlexCenter, NormalText } from '../styled';
import { getStudioName } from '../../selectors';

const StyledView = styled.View`
  flex: 1;
`;

const StyledButtonsView = StyledView.extend`
  align-items: center;
`;

const StyledWelcomeView = FlexCenter.extend`
  flex: 5;
`;

const StyledGrayText = NormalText.extend`
  color: ${DARK_TEXT_GREY};
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

    this.state = {
      currentIndex: 0,
    };

    this.handleOnChangeIndex = this.handleOnChangeIndex.bind(this);
  }

  /**
   * @returns {undefined}
   */
  handleOnPress() {
    this.props.navigation.navigate(VERIFY_ROUTE);
  }
  /**
   * @param {number} index the current index of the swipe page
   * @returns {undefined}
   */
  handleOnChangeIndex(index) {
    this.setState({
      currentIndex: index, // so we can change status bar color depending on background of the slides
    });
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
      <View style={{ flex: 1 }}>
        <CustomStatusBar backgroundColor={'transparent'} barStyle="dark-content" />
        <Swiper
          loop={false}
          onIndexChanged={this.handleOnChangeIndex}
          activeDotStyle={{ backgroundColor: DARK_TEXT_GREY }}
        >
          <FadeInView>
            <StyledWelcomeView>
              <NormalText>Welcome to {this.props.studioName}!</NormalText>
              <StyledGrayText>Swipe to learn more</StyledGrayText>
              {this.props.navigation.state.params &&
                this.props.navigation.state.params.accountReactivated &&
                <NormalText>
                  Your account has been reactivated, please login again.
                </NormalText>
              }
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
      </View>
    );
  }
}

LandingPage.propTypes = {
  navigation: PropTypes.shape(),
  studioName: PropTypes.string,
};

LandingPage.navigationOptions = {
  headerMode: 'none',
};

const mapStateToProps = state => ({
  studioName: getStudioName(state),
});

export default connect(mapStateToProps)(LandingPage);
