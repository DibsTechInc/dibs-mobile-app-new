import React from 'react';
import { Image } from 'react-native';

import ColumnSpotBooking from '../../../../assets/img/column-spotbooking.png';

/**
 * @class ColumnImage
 * @extends {React.PureComponent}
 */
class ColumnImage extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={ColumnSpotBooking}
        style={{ width: 51, height: 31 }}
        resizeMode="contain"
      />
    );
  }
}

export default ColumnImage;
