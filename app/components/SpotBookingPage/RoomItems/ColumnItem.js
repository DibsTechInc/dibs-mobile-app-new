import React from 'react';
import PropTypes from 'prop-types';

import { ColumnImage } from '../../shared';
import RoomItem from './RoomItem';

/**
 * @class ColumnItem
 * @extends {React.PureComponent}
 */
class ColumnItem extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <RoomItem
        rotationDegree={10}
        top_position={this.props.top_position}
        left_position={this.props.left_position}
      >
        <ColumnImage />
      </RoomItem>
    );
  }
}

ColumnItem.propTypes = {
  top_position: PropTypes.number,
  left_position: PropTypes.number,
};

export default ColumnItem;
