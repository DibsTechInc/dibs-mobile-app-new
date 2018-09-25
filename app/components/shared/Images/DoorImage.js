import React from 'react';
import { Image } from 'react-native';

import DoorSpotBooking from '../../../../assets/img/door-spotbooking.png';

/**
 * @class ColumnImage
 * @extends {React.PureComponent}
 */
class DoorImage extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={DoorSpotBooking}
        style={{ width: 42, height: 38 }}
        resizeMode="contain"
      />
    );
  }
}

export default DoorImage;

