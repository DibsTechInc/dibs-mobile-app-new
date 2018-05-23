import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';


/**
 * @class XIcon
 * @extends {React.PureComponent}
 */
class XIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={this.props.onPress}
        style={this.props.style}
      >
        <Svg width={this.props.size} height={this.props.size}>
          <Path
            stroke={this.props.stroke}
            strokeWidth={this.props.strokeWidth}
            strokeLinecap="round"
            d={`M 2 2 L ${this.props.size - 2} ${this.props.size - 2}`}
          />
          <Path
            stroke={this.props.stroke}
            strokeWidth={this.props.strokeWidth}
            strokeLinecap="round"
            d={`M 2 ${this.props.size - 2} L ${this.props.size - 2} 2`}
          />
        </Svg>
      </TouchableOpacity>
    );
  }
}

XIcon.defaultProps = { style: {} };

XIcon.propTypes = {
  onPress: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  stroke: PropTypes.string.isRequired,
  strokeWidth: PropTypes.number.isRequired,
  style: PropTypes.shape(),
};

export default XIcon;
