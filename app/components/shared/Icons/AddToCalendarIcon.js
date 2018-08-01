import React from 'react';
import { Image } from 'react-native';

import AddToCalendarImg from '../../../../assets/img/add-to-calendar.png';

/**
 * @class CalendarIcon
 * @extends {React.PureComponent}
 */
class AddToCalendarIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={AddToCalendarImg}
        style={{
          width: 18,
          height: 18,
          marginLeft: 15,
          marginTop: 2,
        }}
        resizeMode="contain"
      />
    );
  }
}

export default AddToCalendarIcon;
