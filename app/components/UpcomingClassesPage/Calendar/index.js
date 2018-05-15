import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Calendar } from 'react-native-calendars';

import Config from '../../../../config.json';
import { WHITE } from '../../../constants';
import {
  getUpcomingEventsCurrentDate,
  getMinimumUpcomingEventsDate,
  getHasUpcomingClassesPrevMonth,
  getHasUpcomingClassesNextMonth,
} from '../../../selectors';
import {
  setCurrentDateToFirstEventNextMonth,
  setCurrentDateToFirstEventPrevMonth,
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
   * render
   * @returns {JSX.Element} XML
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
