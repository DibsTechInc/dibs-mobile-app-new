import React from 'react';
import { Image } from 'react-native';

import MyClassesImg from '../../../../assets/img/my-classes.png';

/**
 * @class PackageIcon
 * @extends {React.PureComponent}
 */
class MyClassesIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={MyClassesImg}
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

MyClassesIcon.propTypes = {};

export default MyClassesIcon;
