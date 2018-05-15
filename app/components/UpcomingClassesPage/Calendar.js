import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Calendar } from 'react-native-calendars';
import { Svg, Path } from 'react-native-svg';
import { View } from 'react-native';

import Config from '../../../config.json';
import { WHITE } from '../../constants';
import {
  getUpcomingEventsCurrentDate,
  getMinimumUpcomingEventsDate,
  getHasUpcomingClassesPrevMonth,
  getHasUpcomingClassesNextMonth,
} from '../../selectors';
import {
  setCurrentDateToFirstEventNextMonth,
  setCurrentDateToFirstEventPrevMonth,
} from '../../actions';

const ARROW_SVG_WIDTH = 20;

const CalendarArrow = ({ theta = 0 }) => (
  <Svg width={ARROW_SVG_WIDTH} height={20}>
    <Path
      fill="none"
      stroke={WHITE}
      strokeWidth="3"
      strokeLinecap="round"
      d="M 7 2 L 13 10 L 7 18"
      transform={`rotate(${theta}, 10, 10)`}
    />
  </Svg>
);

CalendarArrow.propTypes = { theta: PropTypes.number };

/**
 * @class CalendarComponent
 * @extends {React.PureComponent}
 */
class CalendarComponent extends React.PureComponent {
  /**
   * @constructor
   * @constructs CalendarComponent
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.onPressArrowLeft = this.onPressArrowLeft.bind(this);
    this.onPressArrowRight = this.onPressArrowRight.bind(this);
    this.renderArrow = this.renderArrow.bind(this);
  }
  onPressArrowLeft(callback) {
    if (!this.props.hasEventsPrevMonth) return;
    this.props.setCurrentDateToFirstEventPrevMonth();
    callback();
  }
  onPressArrowRight(callback) {
    if (!this.props.hasEventsNextMonth) return;
    this.props.setCurrentDateToFirstEventNextMonth();
    callback();
  }
  /**
   * @param {string} direction either 'left' or 'right'
   * @returns {JSX} XML
   */
  renderArrow(direction) {
    switch (true) {
      case (direction === 'left' && this.props.hasEventsPrevMonth):
        return <CalendarArrow theta={180} />;

      case (direction === 'right' && this.props.hasEventsNextMonth):
        return <CalendarArrow />;

      default:
        return <View style={{ width: ARROW_SVG_WIDTH }} />;
    }
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Calendar
        style={{
          height: 350,
          backgroundColor:
          Config.STUDIO_COLOR,
          marginTop: 30,
          marginBottom: 10,
        }}
        theme={{
          'stylesheet.calendar.header': {
            monthText: { color: WHITE, fontFamily: 'flex-font-heavy', fontSize: 16 },
            arrow: { paddingVertical: 0, paddingHorizontal: 30 },
            dayHeader: { color: WHITE, fontFamily: 'flex-font', fontSize: 14 },
          },
        }}
        current={this.props.currentDate}
        minDate={this.props.minimumDate}
        firstDay={0}
        renderArrow={this.renderArrow}
        onPressArrowLeft={this.onPressArrowLeft}
        onPressArrowRight={this.onPressArrowRight}
      />
    );
  }
}

CalendarComponent.propTypes = {
  currentDate: PropTypes.string.isRequired,
  minimumDate: PropTypes.string.isRequired,
  hasEventsPrevMonth: PropTypes.bool.isRequired,
  hasEventsNextMonth: PropTypes.bool.isRequired,
  setCurrentDateToFirstEventNextMonth: PropTypes.func.isRequired,
  setCurrentDateToFirstEventPrevMonth: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  currentDate: getUpcomingEventsCurrentDate(state).toISOString(),
  minimumDate: getMinimumUpcomingEventsDate(state).toISOString(),
  hasEventsPrevMonth: getHasUpcomingClassesPrevMonth(state),
  hasEventsNextMonth: getHasUpcomingClassesNextMonth(state),
});
const mapDispatchToProps = {
  setCurrentDateToFirstEventNextMonth,
  setCurrentDateToFirstEventPrevMonth,
};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarComponent);
