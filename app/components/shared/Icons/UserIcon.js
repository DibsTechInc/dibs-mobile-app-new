import React from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';

import GreyUserImg from '../../../../assets/img/user-grey.png';
import WhiteUserImg from '../../../../assets/img/user-white.png';

/**
 * @class UserIcon
 * @extends {React.PureComponent}
 */
class UserIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Image
        source={this.props.fromSideMenu ? GreyUserImg : WhiteUserImg}
        style={{ width: 18, height: 20, margin: 20 }}
      />
    );
  }
}

UserIcon.defaultProps = { fromSideMenu: false };

UserIcon.propTypes = {
  fromSideMenu: PropTypes.bool,
};

export default UserIcon;
