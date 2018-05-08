import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import styles from './CalendarDay.style.js';
import { OFF_WHITE, WHITE } from '../../../constants';
import Config from '../../../../config.json';

/**
 * @class CalendarDay
 * @extends Component
 */
class CalendarDay extends Component {
  /**
   * @constructor
   * @constructs CalendarDay
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.animValue = new Animated.Value(0);
  }
  /**
   * When component mounts, if it is seleced run animation for animation show
   * @returns {undefined}
   */
  componentDidMount() {
    if (this.props.selected) {
      this.animate(1);
    }
  }
  /**
   * When component receives the props, if it is selected use showing animation
   * If it is deselected, use hiding animation
   * @param {Object} props component will get
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (this.props.selected === props.selected) return null;
    if (props.selected) return this.animate(1);
    return this.animate(0);
  }
  /**
   * Animation function for showin/hiding the element.
   * Based on the value passed (either 1 or 0)
   * the animate function is animatin towards that value,
   * hence showin or hiding animation
   * @param {number} toValue for animation
   * @returns {undefined}
   */
  animate(toValue) {
    Animated.timing(
      this.animValue,
      {
        toValue,
        duration: this.props.selectionAnimation.duration,
        easing: Easing.linear,
      }
    ).start();
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const animValue = this.animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Config.STUDIO_COLOR, Config.STUDIO_HIGHLIGHT_COLOR],
    });
    const animObject = { backgroundColor: animValue };

    let dateNameStyle = [styles.dateName, { color: WHITE }];
    let dateNumberStyle = [styles.dateNumber, { color: WHITE }];

    if (this.props.selected) {
      dateNameStyle = [styles.highlightDateNameStyle, { color: Config.STUDIO_TEXT_COLOR }];
      dateNumberStyle = [styles.highlightDateNumberStyle, { color: Config.STUDIO_TEXT_COLOR }];
    }

    return (
      <Animated.View style={[styles.dateContainer, animObject]}>
        <TouchableOpacity
          onPress={this.props.onDateSelected}
          disabled={this.props.isExpiredDate}
        >
          <Text style={dateNameStyle}>{this.props.date.format('ddd').toUpperCase()}</Text>
          <Text style={dateNumberStyle}>{this.props.date.date()}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
}

CalendarDay.defaultProps = {
  selection: 'border',
  selectionAnimation: {
    duration: 0,
    borderWidth: 1,
  },
};

CalendarDay.propTypes = {
  date: PropTypes.shape().isRequired,
  onDateSelected: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  selectionAnimation: PropTypes.shape(),
  isExpiredDate: PropTypes.bool,
};

export default CalendarDay;
