import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';

import { WHITE } from '../../constants';

/**
 * @class BurgerIcon
 * @extends {React.PureComponent}
 */
class BurgerIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <TouchableOpacity
        style={this.props.style}
        onPress={this.props.onPress}
        activeOpacity={1}
      >
        <Svg height={25} width={25}>
          <Path
            stroke={WHITE}
            strokeWidth={3}
            d="M 0 1.5 L 25 1.5"
          />
          <Path
            stroke={WHITE}
            strokeWidth={3}
            d="M 0 8.5 L 25 8.5"
          />
          <Path
            stroke={WHITE}
            strokeWidth={3}
            d="M 0 15.5 L 25 15.5"
          />
          <Path
            stroke={WHITE}
            strokeWidth={3}
            d="M 0 22.5 L 25 22.5"
          />
        </Svg>
      </TouchableOpacity>
    );
  }
}

BurgerIcon.propTypes = {
  style: PropTypes.shape(),
  onPress: PropTypes.func,
};

export default BurgerIcon;
