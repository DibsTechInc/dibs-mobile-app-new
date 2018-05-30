import React from 'react';
import { Image } from 'react-native';

import HomeImage from '../../../../assets/img/main-grey.png';

/**
 * @class HomeIcon
 * @extends {React.PureComponent}
 */
class HomeIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={HomeImage}
        style={{ width: 18, height: 18, margin: 20 }}
        resizeMode="contain"
      />
    );
  }
}

export default HomeIcon;
