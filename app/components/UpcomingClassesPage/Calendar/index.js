import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Calendar } from 'react-native-calendars';
import moment from 'moment-timezone';
import { View } from 'react-native';

import Config from '../../../../config.json';
import { FadeInView } from '../../shared';
import { HEIGHT } from '../../../constants';
import theme from './theme';
import {
  getUpcomingEventsCurrentDate,
  getUpcomingEventCalendarMarkings,
  getStudioInterval,
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
    if (!this.getIfArrowIsEnabled('left')) return;
    this.props.setCurrentDateToFirstEventPrevMonth();
    callback();
  }
  /**
   * @param {function} callback when called calendar goes to next month
   * @returns {undefined}
   */
  onPressArrowRight(callback) {
    if (!this.getIfArrowIsEnabled('right')) return;
    this.props.setCurrentDateToFirstEventNextMonth();
    callback();
  }
  /**
   * @param {Object} date object from Calendar's onDayPress
   * @returns {undefined}
   */
  onDayPress({ dateString }) {
    this.props.setUpcomingEventsCurrentDate(moment.tz(moment(dateString), Config.STUDIO_TZ));
  }
  /**
   * @param {string} direction of arrow
   * @returns {boolean} if the calendar arrow is pressable
   */
  getIfArrowIsEnabled(direction) {
    return (
      moment(this.props.currentDate).isSame(
        moment().tz(Config.STUDIO_TZ).add(Number(direction === 'left'), 'months'),
        'month'
      ) && (direction === 'left' || (
        moment().tz(Config.STUDIO_TZ)
                .add(1, 'months')
                .startOf('month')
                .isBefore(moment().add(this.props.studioInterval, 'days'))
      ))
    );
  }
  /**
   * render
   * @returns {JSX.Element} XML
   */
  render() {
    return (
      <FadeInView style={{ position: 'relative', flex: 0 }}>
        <Calendar
          style={{
            height: (HEIGHT / 3),
            backgroundColor: Config.STUDIO_COLOR,
          }}
          theme={theme}
          current={this.props.currentDate}
          minDate={moment().tz(Config.STUDIO_TZ).startOf('day').toISOString()}
          firstDay={0}
          renderArrow={() => (
            <View
              style={{ opacity: 0, width: 50, height: 50 }}
            />
          )}
          onPressArrowLeft={this.onPressArrowLeft}
          onPressArrowRight={this.onPressArrowRight}
          markedDates={this.props.dateMarkings}
          onDayPress={this.onDayPress}
        />
        <CalendarArrow
          direction="left"
          disabled={!this.getIfArrowIsEnabled('left')}
          style={{
            position: 'absolute',
            left: 70,
            top: 15,
          }}
        />
        <CalendarArrow
          direction="right"
          disabled={!this.getIfArrowIsEnabled('right')}
          style={{
            position: 'absolute',
            right: 70,
            top: 15,
          }}
        />
      </FadeInView>
    );
  }
}

CalendarComponent.propTypes = {
  currentDate: PropTypes.string.isRequired,
  dateMarkings: PropTypes.shape().isRequired,
  studioInterval: PropTypes.number.isRequired,
  setCurrentDateToFirstEventNextMonth: PropTypes.func.isRequired,
  setCurrentDateToFirstEventPrevMonth: PropTypes.func.isRequired,
  setUpcomingEventsCurrentDate: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  currentDate: getUpcomingEventsCurrentDate(state).toISOString(),
  dateMarkings: getUpcomingEventCalendarMarkings(state),
  studioInterval: getStudioInterval(state),
});
const mapDispatchToProps = {
  setCurrentDateToFirstEventNextMonth,
  setCurrentDateToFirstEventPrevMonth,
  setUpcomingEventsCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarComponent);
