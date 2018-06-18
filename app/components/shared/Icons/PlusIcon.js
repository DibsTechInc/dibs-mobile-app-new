import React from 'react';
import PropTypes from 'prop-types';
import { Svg, Path } from 'react-native-svg';

import { DARK_TEXT_GREY } from '../../../constants';

/**
 * @class PlusIcon
 * @extends {React.PureComponent}
 */
class PlusIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Svg
        style={{ margin: 20 }}
        width={this.props.width}
        height={this.props.height}
      >
        <Path
          strokeWidth={this.props.stroke}
          strokeLinecap="round"
          stroke={this.props.iconColor}
          fill="none"
          d="M 2 7.5 L 13 7.5"
        />
        <Path
          strokeWidth={this.props.stroke}
          strokeLinecap="round"
          stroke={this.props.iconColor}
          fill="none"
          d="M 7.5 2 L 7.5 13"
        />
      </Svg>
    );
  }
}

PlusIcon.defaultProps = {
  iconColor: DARK_TEXT_GREY,
  stroke: 1.85,
  width: 15,
  height: 15,
};

PlusIcon.propTypes = {
  iconColor: PropTypes.string,
  stroke: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default PlusIcon;
