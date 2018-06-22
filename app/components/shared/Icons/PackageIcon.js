import React from 'react';
import { Image } from 'react-native';

import GreyPkgImg from '../../../../assets/img/package-grey.png';

/**
 * @class PackageIcon
 * @extends {React.PureComponent}
 */
class PackageIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={GreyPkgImg}
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

PackageIcon.propTypes = {};

export default PackageIcon;
