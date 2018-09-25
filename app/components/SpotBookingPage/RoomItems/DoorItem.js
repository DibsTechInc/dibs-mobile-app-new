import React from 'react';
import PropTypes from 'prop-types';

import { DoorImage } from '../../shared';
import RoomItem from './RoomItem';

/**
 * @class DoorItem
 * @extends {React.PureComponent}
 */
class DoorItem extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <RoomItem
        top_position={this.props.top_position}
        left_position={this.props.left_position}
      >
        <DoorImage />
      </RoomItem>
    );
  }
}

DoorItem.propTypes = {
  top_position: PropTypes.number,
  left_position: PropTypes.number,
};

export default DoorItem;
