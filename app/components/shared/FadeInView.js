import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';

/**
 * @class CartPage
 * @extends {Component}
 */
class FadeInView extends React.Component {
  state = {
    fadeAnim: new Animated.Value(0),
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    Animated.timing(
      this.state.fadeAnim,
      {
        toValue: 1,
        duration: 500,
      }
    ).start();
  }
   /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Animated.View
        style={{
          ...this.props.style,
          opacity: this.state.fadeAnim,
          flex: 1,
        }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

FadeInView.propTypes = {
  style: PropTypes.shape(),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};

export default FadeInView;
