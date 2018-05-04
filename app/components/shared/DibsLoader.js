import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';
import styled from 'styled-components';
import { WHITE } from '../../constants';

const LoaderView = styled.View`
  align-items: center;
  flex-direction: row;
  height: ${props => (2 * props.maxDotRadius)};
  width: ${props => props.width};
`;

const DotContainer = styled.View`
  align-items: center;
  flex: 1;
  justify-content: center;
  width: ${props => (props.width / 3)};
`;

const DibsLoaderDot = props => (
  <DotContainer width={props.width}>
    <Animated.View
      style={{
        ...props.style,
        borderColor: props.dotColor,
        borderWidth: 2,
      }}
    />
  </DotContainer>
);

DibsLoaderDot.propTypes = {
  style: PropTypes.shape(),
  dotColor: PropTypes.string,
  width: PropTypes.number,
};

/**
 * @class DibsLoader
 * @extends {React.Component}
 */
class DibsLoader extends React.Component {
  /**
   * @constructor
   * @constructs DibsLoader
   * @param {Object} props Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      firstDotAnimation: new Animated.Value(1),
      secondDotAnimation: new Animated.Value(0.5),
      thirdDotAnimation: new Animated.Value(0),
    };
    this.getFirstDotStyle = this.getDotStyle.bind(this, 'firstDotAnimation');
    this.getSecondDotStyle = this.getDotStyle.bind(this, 'secondDotAnimation');
    this.getThirdDotStyle = this.getDotStyle.bind(this, 'thirdDotAnimation');
    this.cycleFirstAnimation = this.cycleAnimation.bind(this, 'firstDotAnimation', 1);
    this.cycleSecondAnimation = this.cycleAnimation.bind(this, 'secondDotAnimation', 0.5);
    this.cycleThirdAnimation = this.cycleAnimation.bind(this, 'thirdDotAnimation', 0);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.cycleFirstAnimation(this.cycleFirstAnimation);
    this.cycleSecondAnimation(this.cycleSecondAnimation);
    this.cycleThirdAnimation(this.cycleThirdAnimation);
  }
  /**
   * @param {string} animationKey in state for which animation
   * @returns {Object} style for dot in loader
   */
  getDotStyle(animationKey) {
    const radius = Animated.multiply(this.state[animationKey], this.props.maxDotRadius);
    const diameter = Animated.multiply(2, radius);
    return {
      borderRadius: radius,
      width: diameter,
      height: diameter,
    };
  }
  /**
   * @param {string} animationKey in state for which animation
   * @param {number} offset in [0 - 1]
   * @param {function} callback on complete
   * @returns {undefined}
   */
  cycleAnimation(animationKey, offset, callback) {
    const animation = this.state[animationKey];
    Animated.sequence([
      Animated.timing(
        animation,
        {
          toValue: 1,
          duration: this.props.duration * (1 - offset),
        }
      ),
      Animated.timing(
        animation,
        {
          toValue: 0,
          duration: this.props.duration,
        }
      ),
      Animated.timing(
        animation,
        {
          toValue: offset,
          duration: this.props.duration * offset,
        }
      ),
    ]).start(() => callback(callback));
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <LoaderView {...this.props}>
        <DibsLoaderDot {...this.props} style={this.getFirstDotStyle()} />
        <DibsLoaderDot {...this.props} style={this.getSecondDotStyle()} />
        <DibsLoaderDot {...this.props} style={this.getThirdDotStyle()} />
      </LoaderView>
    );
  }
}

DibsLoader.defaultProps = {
  maxDotRadius: 15,
  dotColor: WHITE,
  width: 200,
  duration: 500,
};

DibsLoader.propTypes = {
  maxDotRadius: PropTypes.number,
  dotColor: PropTypes.string,
  width: PropTypes.number,
  duration: PropTypes.number,
};

export default DibsLoader;
