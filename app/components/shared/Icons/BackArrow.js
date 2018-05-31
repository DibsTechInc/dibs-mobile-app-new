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
        <Svg height={25} width={25}>
          <Path
            stroke={this.props.stroke}
            strokeWidth={this.props.strokeWidth}
            d="M 10 3 L 1.7 12.5 L 10 22"
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
  strokeWidth: 1.5,
};

BackArrow.propTypes = {
  stroke: PropTypes.string,
  style: PropTypes.shape(),
  onPress: PropTypes.func,
  strokeWidth: PropTypes.number,
};

export default BackArrow;
