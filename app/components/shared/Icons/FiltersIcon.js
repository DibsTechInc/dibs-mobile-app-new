import React from 'react';
import { Image } from 'react-native';

import FiltersImg from '../../../../assets/img/filter-white.png';

/**
 * @class TrashIcon
 * @extends {React.PureComponent}
 */
class FiltersIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={FiltersImg}
        style={{ width: 20, height: 20, margin: 20 }}
        resizeMode="contain"
      />
    );
  }
}

export default FiltersIcon;
