import React from 'react';
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
        width={15}
        height={15}
      >
        <Path
          strokeWidth={1.85}
          strokeLinecap="round"
          stroke={DARK_TEXT_GREY}
          fill="none"
          d="M 2 7.5 L 13 7.5"
        />
        <Path
          strokeWidth={1.85}
          strokeLinecap="round"
          stroke={DARK_TEXT_GREY}
          fill="none"
          d="M 7.5 2 L 7.5 13"
        />
      </Svg>
    );
  }
}

export default PlusIcon;
