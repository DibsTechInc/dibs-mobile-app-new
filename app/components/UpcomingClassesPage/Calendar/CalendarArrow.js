import React from 'react';
import PropTypes from 'prop-types';
import { Svg, Path } from 'react-native-svg';

import { WHITE } from '../../../constants';

/**
 * @class CalendarArrow
 * @extends {React.PureComponent}
 */
class CalendarArrow extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Svg
        width={20}
        height={20}
        style={{ ...this.props.style, opacity: this.props.disabled ? 0.1 : 1 }}
        pointerEvents="none"
      >
        <Path
          fill="none"
          stroke={WHITE}
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M 7 2 L 13 10 L 7 18"
          transform={`rotate(${this.props.direction === 'left' ? 180 : 0}, 10, 10)`}
        />
      </Svg>
    );
  }
}

CalendarArrow.propTypes = {
  disabled: PropTypes.bool.isRequired,
  direction: PropTypes.string.isRequired,
  style: PropTypes.shape().isRequired,
};

export default CalendarArrow;
