import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import CustomRoomGrid from './CustomRoomGrid';
import GridRow from './GridRow';
import RoomItemMap from './RoomItemMap';


/**
 * @class RoomGrid
 * @extends {React.PureComponent}
 */
class RoomGrid extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const gridRows = this.props.spotGrid.map(spotRow => (
      <GridRow
        key={Math.random()}
        row={spotRow}
        {...this.props}
      />));

    if (this.props.customRoomUrl) {
      return (
        <CustomRoomGrid {...this.props} />
      );
    }

    const roomItems = this.props.roomItems.map((roomItem) => {
      if (!roomItem || !roomItem.name) {
        return null;
      }

      return (
        <RoomItemMap
          key={roomItem.id}
          type={roomItem.name}
          top_position={roomItem.top_position}
          left_position={roomItem.left_position}
        />);
    });

    return (
      <View style={{ flexDirection: 'row', position: 'relative' }}>
        {gridRows}
        {roomItems}
      </View>
    );
  }
}

RoomGrid.propTypes = {
  spotGrid: PropTypes.arrayOf(PropTypes.array),
  roomItems: PropTypes.arrayOf(PropTypes.shape()),
  customRoomUrl: PropTypes.string,
};

export default RoomGrid;
