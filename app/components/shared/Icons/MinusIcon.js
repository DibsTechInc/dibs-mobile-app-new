import React from 'react';
import { Svg, Path } from 'react-native-svg';

import { DARK_TEXT_GREY } from '../../../constants';

/**
 * @class MinusIcon
 * @extends {React.PureComponent}
 */
class MinusIcon extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Svg
        style={{ margin: 20 }}
        width={15}
        height={15}
      >
        <Path
          strokeWidth={1.85}
          strokeLinecap="round"
          stroke={DARK_TEXT_GREY}
          fill="none"
          d="M 2 9 L 16 9"
        />
      </Svg>
    );
  }
}

export default MinusIcon;
