import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Spot from './Spot';
import { WIDTH, HEIGHT } from '../../constants';

const CustomRoomDiv = styled.View`
  align-items: center;
  margin-bottom: 200px;
`;

const CustomRoomImg = styled.Image`
  width: ${WIDTH};
  height: ${HEIGHT};
`;

/**
 * @class CustomRoomGrid
 * @extends {React.PureComponent}
 */
class CustomRoomGrid extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const spotGrid = this.props.spotGrid.map(row =>
      row.filter(Boolean).map(spot =>
        (<Spot
          key={`${spot.top_position}-${spot.left_position}`}
          displayZingfitId
          customRoomUrl={this.props.customRoomUrl}
          {...this.props}
          {...spot}
        />)
      )
    );

    return (
      <CustomRoomDiv>
        <CustomRoomImg resizeMode="stretch" source={{ uri: this.props.customRoomUrl }} />
        {spotGrid}
      </CustomRoomDiv>
    );
  }
}

CustomRoomGrid.propTypes = {
  spotGrid: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.shape())),
  customRoomUrl: PropTypes.string,
};

export default CustomRoomGrid;
