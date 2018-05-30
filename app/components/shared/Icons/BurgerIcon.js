import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';

import { WHITE } from '../../../constants';

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
        <Svg height={16} width={16}>
          <Path
            stroke={WHITE}
            strokeWidth={1.5}
            d="M 0 1 L 18 1"
          />
          <Path
            stroke={WHITE}
            strokeWidth={1.5}
            d="M 0 8 L 18 8"
          />
          <Path
            stroke={WHITE}
            strokeWidth={1.5}
            d="M 0 15 L 18 15"
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
