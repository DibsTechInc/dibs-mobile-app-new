import React from 'react';
import { View, Image } from 'react-native';
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
    const uri = this.props.instructorImageURL ? this.props.instructorImageURL : 'https://s3.amazonaws.com/dibs-instructor-images/cycle-house/placeholder_instructor.png';

    return (
      <View style={{ flexDirection: 'row', position: 'relative' }}>
        <Image
          style={{ position: 'absolute', width: 50, height: 50, borderWidth: 1, borderRadius: 25, right: 0, top: '45%' }}
          source={{ uri }}
        />
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
  instructorImageURL: PropTypes.string,
};

export default RoomGrid;
