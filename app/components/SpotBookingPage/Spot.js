import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { LIGHT_GREY, GREY, BLACK, WHITE } from '../../constants';
import { NormalText } from '../styled';
import Config from '../../../config.json';

const BaseSpot = styled.View`
  width: 30px;
  height: 30px;
  margin: 4px;
`;

const UnavailableSpot = BaseSpot.extend`
  border-width: 1;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${LIGHT_GREY};
  border-color: ${LIGHT_GREY};
`;

const AvailableSpot = styled.TouchableOpacity`
  width: 30px;
  height: 30px;
  margin: 4px;
  border-width: 1;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${props => props.userSelected ? Config.STUDIO_COLOR : 'transparent'};
  border-color: ${props => props.userSelected ? Config.STUDIO_COLOR : BLACK};
`;

const DisplayText = NormalText.extend`
  color: ${props => props.userSelected ? WHITE : BLACK};
`;

/**
 * @class Spot
 * @extends {React.PureComponent}
 */
class Spot extends React.PureComponent {
  /**
   * @constructor
   * @constructs Spot
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.toggleSpotInCart = this.toggleSpotInCart.bind(this);
  }

  /**
   * @returns {function} spot toggle method
   */
  toggleSpotInCart() {
    const { id, x, y, eventid, userSelected, source_id } = this.props;
    return userSelected
      ? this.props.removeSpotFromCart(eventid, { id, x, y, source_id })
      : this.props.setSpotInCart(eventid, { id, x, y, source_id });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (this.props.empty) return <BaseSpot />;
    const displayID = this.props.displayZingfitId ? this.props.source_id : this.props.id;

    if (!this.props.available) {
      return (
        <UnavailableSpot>
          <NormalText style={{ color: GREY }}>{displayID}</NormalText>
        </UnavailableSpot>
      );
    }

    return (
      <AvailableSpot onPress={this.toggleSpotInCart} userSelected={this.props.userSelected}>
        <DisplayText userSelected={this.props.userSelected}>{displayID}</DisplayText>
      </AvailableSpot>
    );
  }
}

Spot.propTypes = {
  id: PropTypes.number,
  displayZingfitId: PropTypes.bool,
  empty: PropTypes.bool,
  source_id: PropTypes.string,
  available: PropTypes.bool,
  setSpotInCart: PropTypes.func,
  userSelected: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number,
  eventid: PropTypes.number,
  removeSpotFromCart: PropTypes.func,
};

export default Spot;
