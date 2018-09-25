import React from 'react';
import PropTypes from 'prop-types';

import { ROOM_ITEMS_ENUM } from '../../constants';
import { ColumnItem, DoorItem } from './RoomItems';

/**
 * @class RoomItemMap
 * @extends {React.PureComponent}
 */
class RoomItemMap extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    switch (Symbol(this.props.type).toString()) {
      case ROOM_ITEMS_ENUM.COLUMN.toString():
        return (
          <ColumnItem
            top_position={this.props.top_position}
            left_position={this.props.left_position}
          />
        );
      case ROOM_ITEMS_ENUM.DOOR.toString():
        return (
          <DoorItem
            top_position={this.props.top_position}
            left_position={this.props.left_position}
          />
        );
      default:
        return null;
    }
  }
}

RoomItemMap.propTypes = {
  type: PropTypes.string,
  top_position: PropTypes.number,
  left_position: PropTypes.number,
};

export default RoomItemMap;
