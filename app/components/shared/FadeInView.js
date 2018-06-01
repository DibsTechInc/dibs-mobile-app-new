import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';

/**
 * @class CartPage
 * @extends {Component}
 */
class FadeInView extends React.PureComponent {
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
        duration: this.props.duration,
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
          flex: 1,
          opacity: this.state.fadeAnim,
          ...this.props.style,
        }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

FadeInView.defaultProps = { duration: 500 };

FadeInView.propTypes = {
  style: PropTypes.shape(),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
  duration: PropTypes.number,
};

export default FadeInView;
