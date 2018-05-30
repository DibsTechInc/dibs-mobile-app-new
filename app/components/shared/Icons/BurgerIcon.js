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
        <Svg height={12} width={16}>
          <Path
            stroke={WHITE}
            strokeWidth={1.8}
            d="M 0 1 L 18 1"
          />
          <Path
            stroke={WHITE}
            strokeWidth={1.8}
            d="M 0 6 L 18 6"
          />
          <Path
            stroke={WHITE}
            strokeWidth={1.8}
            d="M 0 11 L 18 11"
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
