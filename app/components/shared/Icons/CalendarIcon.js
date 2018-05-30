import React from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';

import GreyCalendarImg from '../../../../assets/img/calendar-grey.png';
import WhiteCalendarImg from '../../../../assets/img/calendar-white.png';

/**
 * @class CalendarIcon
 * @extends {React.PureComponent}
 */
class CalendarIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={this.props.fromSideMenu ? GreyCalendarImg : WhiteCalendarImg}
        style={{ width: 18, height: 18, margin: 20 }}
      />
    );
  }
}

CalendarIcon.defaultProps = { fromSideMenu: false };

CalendarIcon.propTypes = {
  fromSideMenu: PropTypes.bool,
};

export default CalendarIcon;
