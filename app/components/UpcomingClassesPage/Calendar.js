import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Calendar } from 'react-native-calendars';

import Config from '../../../config.json';
import { WHITE } from '../../constants';
import {
  getUpcomingEventsCurrentDate,
  getMinimumUpcomingEventsDate,
} from '../../selectors';

/**
 * @class CalendarComponent
 * @extends {React.PureComponent}
 */
class CalendarComponent extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Calendar
        style={{ height: 350, backgroundColor: Config.STUDIO_COLOR }}
        theme={{
          'stylesheet.calendar.header': { monthText: { color: WHITE } },
        }}
        current={this.props.currentDate}
        minDate={this.props.minimumDate}
        firstDay={0}
      />
    );
  }
}

CalendarComponent.propTypes = {
  currentDate: PropTypes.string,
  minimumDate: PropTypes.string,
};

const mapStateToProps = state => ({
  currentDate: getUpcomingEventsCurrentDate(state).toISOString(),
  minimumDate: getMinimumUpcomingEventsDate(state).toISOString(),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarComponent);
