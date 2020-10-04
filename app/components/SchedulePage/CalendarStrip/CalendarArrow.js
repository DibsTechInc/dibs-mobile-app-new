import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Svg, Path } from 'react-native-svg';

import { WHITE } from '../../../constants';

const ArrowContainer = styled.TouchableOpacity`
  align-items: center;
  flex: 0.1;
  justify-content: center;
  padding-${props => (props.rightArrow ? 'right' : 'left')}: 7;
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
        {!this.props.disabled ? (
          <Svg height={25} width={25}>
            <Path
              stroke={WHITE}
              strokeWidth={2.5}
              d="M 10 3 L 1.7 12.5 L 10 22"
              fill="none"
              strokeLinecap="round"
              transform={`rotate(${this.props.rightArrow ? 180 : 0}, 12.5, 12.5)`}
            />
          </Svg>
        ) : undefined}
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
