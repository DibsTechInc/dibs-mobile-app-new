import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Spot from './Spot';

/**
 * @class GridRow
 * @extends {React.PureComponent}
 */
class GridRow extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const spotRow = this.props.row.map(spot =>
      (spot ? <Spot
        key={spot.id}
        id={spot.id}
        x={spot.x}
        y={spot.y}
        type={spot.type}
        displayZingfitId
        available={spot.available}
        source_id={spot.source_id}
        setSpotInCart={this.props.setSpotInCart}
        userSelected={spot.userSelected}
        eventid={this.props.eventid}
        removeSpotFromCart={this.props.removeSpotFromCart}
        instructorImageURL={this.props.instructorImageURL}
      /> : <Spot key={Math.random()} empty />));

    return (
      <View style={{ flexDirection: 'column-reverse' }}>
        {spotRow}
      </View>
    );
  }
}

GridRow.propTypes = {
  row: PropTypes.arrayOf(PropTypes.shape()),
  setSpotInCart: PropTypes.func,
  removeSpotFromCart: PropTypes.func,
  eventid: PropTypes.number,
  instructorImageURL: PropTypes.string,
};

export default GridRow;
