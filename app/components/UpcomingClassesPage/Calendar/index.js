import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Calendar } from 'react-native-calendars';
import moment from 'moment-timezone';

import Config from '../../../../config.json';
import theme from './theme';
import {
  getUpcomingEventsCurrentDate,
  getMinimumUpcomingEventsDate,
  getHasUpcomingClassesPrevMonth,
  getHasUpcomingClassesNextMonth,
  getUpcomingEventCalendarMarkings,
} from '../../../selectors';
import {
  setCurrentDateToFirstEventNextMonth,
  setCurrentDateToFirstEventPrevMonth,
  setUpcomingEventsCurrentDate,
} from '../../../actions';
import CalendarArrow from './CalendarArrow';

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
    this.onDayPress = this.onDayPress.bind(this);
  }
  /**
   * @param {function} callback when called calendar goes to prev month
   * @returns {undefined}
   */
  onPressArrowLeft(callback) {
    if (!this.props.hasEventsPrevMonth) return;
    this.props.setCurrentDateToFirstEventPrevMonth();
    callback();
  }
  /**
   * @param {function} callback when called calendar goes to next month
   * @returns {undefined}
   */
  onPressArrowRight(callback) {
    if (!this.props.hasEventsNextMonth) return;
    this.props.setCurrentDateToFirstEventNextMonth();
    callback();
  }
  /**
   * @param {Object} date object from Calendar's onDayPress
   * @returns {undefined}
   */
  onDayPress({ dateString }) {
    this.props.setUpcomingEventsCurrentDate(moment.tz(dateString, Config.STUDIO_TZ));
  }
  /**
   * render
   * @returns {JSX.Element} XML
   */
  render() {
    console.log('test')
    return (
      <Calendar
        style={{
          height: 350,
          backgroundColor: Config.STUDIO_COLOR,
          marginTop: 30,
        }}
        theme={theme}
        current={this.props.currentDate}
        minDate={this.props.minimumDate}
        firstDay={0}
        renderArrow={direction => (
          <CalendarArrow
            direction={direction}
            disabled={(
              direction === 'left' ?
                !this.props.hasEventsPrevMonth : !this.props.hasEventsNextMonth
            )}
          />
        )}
        onPressArrowLeft={this.onPressArrowLeft}
        onPressArrowRight={this.onPressArrowRight}
        markedDates={this.props.dateMarkings}
        onDayPress={this.onDayPress}
      />
    );
  }
}

CalendarComponent.propTypes = {
  currentDate: PropTypes.string.isRequired,
  minimumDate: PropTypes.string.isRequired,
  hasEventsPrevMonth: PropTypes.bool.isRequired,
  hasEventsNextMonth: PropTypes.bool.isRequired,
  dateMarkings: PropTypes.shape().isRequired,
  setCurrentDateToFirstEventNextMonth: PropTypes.func.isRequired,
  setCurrentDateToFirstEventPrevMonth: PropTypes.func.isRequired,
  setUpcomingEventsCurrentDate: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  currentDate: getUpcomingEventsCurrentDate(state).toISOString(),
  minimumDate: getMinimumUpcomingEventsDate(state).toISOString(),
  hasEventsPrevMonth: getHasUpcomingClassesPrevMonth(state),
  hasEventsNextMonth: getHasUpcomingClassesNextMonth(state),
  dateMarkings: getUpcomingEventCalendarMarkings(state),
});
const mapDispatchToProps = {
  setCurrentDateToFirstEventNextMonth,
  setCurrentDateToFirstEventPrevMonth,
  setUpcomingEventsCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarComponent);
