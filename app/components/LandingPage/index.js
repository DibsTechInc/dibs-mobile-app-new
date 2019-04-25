
import React, { Component } from 'react';
import { Updates } from 'expo';
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
      isFlexStudios: Config.DIBS_STUDIO_ID === '1', // Flex studios specific
      currentFlexStudiosId: null, // Flex studios specific
    };

    this.handleOnChangeIndex = this.handleOnChangeIndex.bind(this);
    this.checkCurrentLocation = this.checkCurrentLocation.bind(this);
    this.handleOnPressChangeLocation = this.handleOnPressChangeLocation.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    await this.checkCurrentLocation();
  }

  /**
   * @returns {undefined}
   */
  async checkCurrentLocation() {
    if (Config.DIBS_STUDIO_ID !== '1') return;
    const currentFlexStudiosId = await AsyncStorage.getItem(Config.FLEX_STUDIO_LOCATION);
    console.log(currentFlexStudiosId, '?dd?');
    await new Promise(res => this.setState({ currentFlexStudiosId }, res));
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
  async handleOnPressChangeLocation() {
    if (Config.DIBS_STUDIO_ID !== '1') return;
    const idToChange = this.state.currentFlexStudiosId === '1' ? '153' : '1';
    await AsyncStorage.setItem(Config.FLEX_STUDIO_LOCATION, idToChange);

    Updates.reload();
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
    // Hard coded names for Flex
    const otherStudioName = this.state.currentFlexStudiosId === '1'
      ? 'Woodbury' : 'Union Square';

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
              <StyledGrayText>Press continue to sign in</StyledGrayText>
              {this.props.navigation.state.params &&
                this.props.navigation.state.params.accountReactivated &&
                <NormalText style={{ paddingHorizontal: 10, paddingVertical: 15, textAlign: 'center' }}>
                  Your account has been reactivated, please login again.
                </NormalText>
              }
            </StyledWelcomeView>
            <StyledButtonsView>
              {this.state.isFlexStudios && this.state.currentFlexStudiosId && (
                <MaterialButton
                  onPress={this.handleOnPressChangeLocation}
                  text={`${otherStudioName} location`}
                  style={{ width: '75%', height: 40, marginBottom: 10 }}
                />
              )}
              <MaterialButton
                onPress={this.handleOnPress}
                text="Continue"
                style={{ width: '75%', height: 40 }}
              />
            </StyledButtonsView>
          </FadeInView>
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

/*
  <About studioName={this.props.studioName} />
  Swipe to learn more
  WILL ADD IN LATER WHEN FLEX PROVIDES US WITH DETAILS
*/
