import React from 'react';
import { Image } from 'react-native';

import TrashImg from '../../../../assets/img/trash-grey.png';

/**
 * @class TrashIcon
 * @extends {React.PureComponent}
 */
class TrashIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={TrashImg}
        style={{ width: 15, height: 15, margin: 20 }}
        resizeMode="contain"
      />
    );
  }
}

export default TrashIcon;
