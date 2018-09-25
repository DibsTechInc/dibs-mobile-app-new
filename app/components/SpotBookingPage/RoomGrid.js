import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

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
        setSpotInCart={this.props.setSpotInCart}
        removeSpotFromCart={this.props.removeSpotFromCart}
        eventid={this.props.eventid}
        instructorImageURL={this.props.instructorImageURL}
      />));

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
  eventid: PropTypes.number,
  setSpotInCart: PropTypes.func,
  removeSpotFromCart: PropTypes.func,
  instructorImageURL: PropTypes.string,
  roomItems: PropTypes.arrayOf(PropTypes.shape()),
};

export default RoomGrid;
