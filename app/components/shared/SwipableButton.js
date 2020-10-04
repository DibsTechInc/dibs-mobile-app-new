import React from 'react';
import { View, Animated } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isIphoneX } from 'react-native-iphone-x-helper';
import Swipeable from 'react-native-swipeable';

import Config from '../../../config.json';
import { WIDTH, LIGHT_GREY, WHITE } from '../../constants';
import { HeavyText } from '../styled';

const ContinueButton = styled.TouchableOpacity`
  padding-right: 10px;
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: ${Config.STUDIO_COLOR};
  border-width: 1px;
  border-color: ${Config.STUDIO_COLOR};
`;

const SwipeText = styled(HeavyText)`
  text-align: center;
  color: ${WHITE};
  flex: 1;
`;

/**
 * @class SwipableButton
 * @extends {React.Component}
 */
class SwipableButton extends React.Component {
  /**
   * @constructor
   * @constructs SwipableButton
   * @param {Object} props Component props
   */
  constructor(props) {
    super(props);

    this.state = {
      animValue: new Animated.Value(0),
    };
  }

  /**
   * @returns {undefined}
   */
  componentDidMount() {
    if (this.props.notReadyForPurchase) {
      this.animateSwipe();
    }
    this.resetAnimInterval(false);
  }
  /**
   * @param {Object} props previous props
   * @param {Object} state previous state
   * @returns {undefined}
   */
  componentDidUpdate() {
    this.resetAnimInterval();
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.swipeAnimInterval) clearInterval(this.swipeAnimInterval);
  }
  /**
   * @returns {undefined}
   */
  animateSwipe() {
    Animated.sequence([
      Animated.timing(
        this.state.animValue,
        { toValue: 1, duration: 2e3 }
      ),
      Animated.timing(
        this.state.animValue,
        { toValue: 0, duration: 0 }
      ),
    ]).start();
  }
  /**
   * @param {boolean} resetAnimation if true resets swipe animation
   * @returns {undefined}
   */
  resetAnimInterval(resetAnimation = true) {
    if (this.swipeAnimInterval) {
      clearInterval(this.swipeAnimInterval);
      this.swipeAnimInterval = null;
    }
    if (resetAnimation) Animated.timing(this.state.animValue, { toValue: 0, duration: 0 }).start();
    this.swipeAnimInterval = setInterval(() => {
      if (!this.props.notReadyForPurchase) this.animateSwipe();
    }, 6e3);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const purchaseButton = [
      <ContinueButton />,
    ];

    const renderButtonColor = this.props.notReadyForPurchase ? LIGHT_GREY : Config.STUDIO_COLOR;
    const renderLeftButtons = this.props.notReadyForPurchase ? null : purchaseButton;

    return (
      <View style={{ overflow: 'hidden', backgroundColor: Config.STUDIO_COLOR, width: WIDTH }}>
        <Swipeable
          contentContainerStyle={{
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: renderButtonColor,
            height: 45,
            marginBottom: Number(isIphoneX()) && 45,
            borderWidth: 1,
            borderColor: renderButtonColor,
            overflow: 'hidden',
          }}
          leftButtons={renderLeftButtons}
          onLeftButtonsActivate={this.props.onLeftButtonsActivate}
          leftButtonsActivationDistance={150}
        >
          <SwipeText>
            {this.props.swipeText}
          </SwipeText>
          <Animated.View
            style={{
              backgroundColor: WHITE,
              opacity: 0.18,
              position: 'absolute',
              height: 70,
              width: 30,
              top: -10,
              transform: [{ rotate: '20deg' }],
              left: Animated.add(-0.5 * WIDTH, Animated.multiply(2 * WIDTH, this.state.animValue)),
            }}
            pointerEvents="none"
          />
        </Swipeable>
      </View>
    );
  }
}

SwipableButton.propTypes = {
  swipeText: PropTypes.string.isRequired,
  notReadyForPurchase: PropTypes.bool.isRequired,
  onLeftButtonsActivate: PropTypes.func.isRequired,
};

export default SwipableButton;
