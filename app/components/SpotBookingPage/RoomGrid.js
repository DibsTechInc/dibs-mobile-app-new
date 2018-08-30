import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import GridRow from './GridRow';

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
      />));

    return (
      <View style={{ flexDirection: 'row', position: 'relative' }}>
        {gridRows}
      </View>
    );
  }
}

RoomGrid.propTypes = {
  spotGrid: PropTypes.arrayOf(PropTypes.array),
  eventid: PropTypes.number,
  setSpotInCart: PropTypes.func,
  removeSpotFromCart: PropTypes.func,
};

export default RoomGrid;
