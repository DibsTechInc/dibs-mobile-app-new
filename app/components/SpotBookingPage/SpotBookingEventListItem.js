import React from 'react';
import PropTypes from 'prop-types';

import RoomGrid from './RoomGrid';
import { FadeInView, LinearLoader } from '../shared';
import { NormalText } from '../styled';
import Config from '../../../config.json';

import { WIDTH, HEIGHT } from '../../constants';

/**
 * @class SpotBookingEventListItem
 * @extends {React.PureComponent}
 */
class SpotBookingEventListItem extends React.PureComponent {
  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    if (!this.props.event.room) {
      await this.props.getRoomForEvent(this.props.event.eventid);
    }
  }
  /**
   * @returns {undefined}
   */
  async componentDidUpdate() {
    if (!this.props.event.room) {
      await this.props.getRoomForEvent(this.props.event.eventid);

      // remove addEventToCart for a different solution if we decide to allow multiple spot bookings at once
      this.props.addEventToCart({
        eventid: this.props.event.eventid,
        passid: this.props.event.passid || null,
        price: this.props.event.price,
      });
    }
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (!this.props.event.room) {
      return (
        <FadeInView style={{ flex: 0, marginBottom: 50, position: 'absolute', top: '35%' }}>
          <NormalText style={{ textAlign: 'center', marginBottom: 10 }}>Loading spots...</NormalText>
          <LinearLoader color={Config.STUDIO_COLOR} />
        </FadeInView>);
    }

    return (
      <FadeInView style={{ flex: 0, marginBottom: 50 }}>
        <RoomGrid
          spotGrid={this.props.spots}
          setSpotInCart={this.props.setSpotInCart}
          removeSpotFromCart={this.props.removeSpotFromCart}
          eventid={this.props.event.eventid}
          instructorImageURL={this.props.event.instructorImageURL}
          customRoomUrl={this.props.customRoomUrl}
          roomItems={this.props.roomItems}
        />
      </FadeInView>
    );
  }
}

SpotBookingEventListItem.propTypes = {
  event: PropTypes.shape(),
  getRoomForEvent: PropTypes.func,
  spots: PropTypes.arrayOf(PropTypes.array),
  setSpotInCart: PropTypes.func,
  removeSpotFromCart: PropTypes.func,
  addEventToCart: PropTypes.func,
  customRoomUrl: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  roomItems: PropTypes.arrayOf(PropTypes.shape()),
};

export default SpotBookingEventListItem;
