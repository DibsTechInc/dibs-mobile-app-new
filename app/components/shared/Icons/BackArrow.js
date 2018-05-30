import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import Config from '../../../../config.json';

/**
 * @class BackArrow
 * @extends {React.PureComponent}
 */
class BackArrow extends React.PureComponent {
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
        <Svg height={18} width={18}>
          <Path
            stroke={this.props.stroke}
            strokeWidth={1.5}
            d="M 7.2 3 L 1.2 9 L 7.2 15"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>
    );
  }
}

BackArrow.defaultProps = {
  stroke: Config.STUDIO_COLOR,
};

BackArrow.propTypes = {
  stroke: PropTypes.string,
  style: PropTypes.shape(),
  onPress: PropTypes.func,
};

export default BackArrow;
