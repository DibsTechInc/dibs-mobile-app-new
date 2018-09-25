import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

/**
 * @class RoomItem
 * @extends {React.PureComponent}
 */
class RoomItem extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View
        style={{
          width: this.props.width,
          height: this.props.height,
          borderRadius: this.props.borderRadius,
          backgroundColor: this.props.backgroundColor,
          top: `${this.props.top_position}%`,
          left: `${this.props.left_position}%`,
          transform: [{ rotate: `${this.props.rotationDegree}deg` }],
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
        }}
      >
        {this.props.children}
      </View>
    );
  }
}

RoomItem.defaultProps = {
  rotationDegree: 0,
};

RoomItem.propTypes = {
  top_position: PropTypes.number,
  left_position: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  borderRadius: PropTypes.string,
  rotationDegree: PropTypes.number,
  backgroundColor: PropTypes.string,
  children: PropTypes.node,
};

export default RoomItem;
