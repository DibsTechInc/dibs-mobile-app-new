import React from 'react';
import { Image } from 'react-native';

import RafWhiteIcon from '../../../../assets/img/raf-white.png';

/**
 * @class UserIcon
 * @extends {React.PureComponent}
 */
class RafIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={RafWhiteIcon}
        style={{
          width: 18,
          height: 18,
          margin: 20,
        }}
        resizeMode="contain"
      />
    );
  }
}

export default RafIcon;
