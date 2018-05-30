import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Svg, Path } from 'react-native-svg';

import { WHITE } from '../../../constants';

const ArrowContainer = styled.TouchableOpacity`
  align-items: center;
  flex: 0.1;
  justify-content: center;
  padding-${props => (props.rightArrow ? 'right' : 'left')}: 5;
  padding-vertical: 10;
`;

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
      <ArrowContainer
        onPress={this.props.onPress}
        disabled={this.props.disabled}
        activeOpacity={1}
        rightArrow={this.props.rightArrow}
      >
        {!this.props.disabled && (
          <Svg height={18} width={18}>
            <Path
              stroke={WHITE}
              strokeWidth={1.5}
              d="M 7.2 3 L 1.2 9 L 7.2 15"
              fill="none"
              strokeLinecap="round"
              transform={`rotate(${this.props.rightArrow ? 180 : 0}, 9, 9)`}
            />
          </Svg>
        )}
      </ArrowContainer>
    );
  }
}

CalendarArrow.defaultProps = {
  disabled: false,
  rightArrow: false,
};

CalendarArrow.propTypes = {
  onPress: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  rightArrow: PropTypes.bool,
};

export default CalendarArrow;
