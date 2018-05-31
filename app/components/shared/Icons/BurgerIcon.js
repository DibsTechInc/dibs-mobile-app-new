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
        <Svg height={14} width={18}>
          <Path
            stroke={WHITE}
            strokeWidth={2}
            d="M 0 1 L 18 1"
          />
          <Path
            stroke={WHITE}
            strokeWidth={2}
            d="M 0 7 L 18 7"
          />
          <Path
            stroke={WHITE}
            strokeWidth={2}
            d="M 0 13 L 18 13"
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
