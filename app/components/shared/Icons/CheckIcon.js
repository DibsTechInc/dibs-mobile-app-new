import React from 'react';
import PropTypes from 'prop-types';
import { Image, TouchableOpacity } from 'react-native';

import CheckImg from '../../../../assets/img/check-white.png';

/**
 * @class TrashIcon
 * @extends {React.PureComponent}
 */
class CheckIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={this.props.handleOnPress}
      >
        <Image
          source={CheckImg}
          style={{ width: 22, height: 22, margin: 20 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }
}

CheckIcon.propTypes = {
  handleOnPress: PropTypes.func,
};

export default CheckIcon;
