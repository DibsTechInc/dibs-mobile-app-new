import React from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';

import GreyActivityImg from '../../../../assets/img/activity-grey.png';
import WhiteActivityImg from '../../../../assets/img/activity-white.png';

/**
 * @class ActivityIcon
 * @extends {React.PureComponent}
 */
class ActivityIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={this.props.fromSideMenu ? GreyActivityImg : WhiteActivityImg}
        style={{
          width: this.props.fromSideMenu ? 18 : 27,
          height: this.props.fromSideMenu ? 18 : 27,
          margin: 20,
        }}
        resizeMode="contain"
      />
    );
  }
}

ActivityIcon.defaultProps = {
  fromSideMenu: false,
};

ActivityIcon.propTypes = {
  fromSideMenu: PropTypes.bool,
};

export default ActivityIcon;
