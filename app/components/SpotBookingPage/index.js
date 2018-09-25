import React from 'react';
import { connect } from 'react-redux';
import { ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import { withNavigation } from 'react-navigation';
import styled from 'styled-components';

import { FadeInView, SwipableButton } from '../shared';
import { NormalText, HeavyText } from '../styled';

import {
  WIDTH,
  HEIGHT,
  CART_ROUTE,
} from '../../constants';

import {
  getCurrentSpotBookingEvent,
  getSpotGridForEventWithSetter,
  getEventsData,
  getAllSpotBookingSpotsPicked,
  getCurrentSpotBookingEventFormattedTimes,
  getStudioSpotLabel,
  getRoomItemsWithSetter,
} from '../../selectors';

import {
  getRoomForEvent,
  setSpotInCart,
  removeSpotFromCart,
  addEventToCart,
  setCurrentSpotBookingEventId,
} from '../../actions';

import SpotBookingEventListItem from './SpotBookingEventListItem';
import Header from '../Header';

const InfoView = styled.View`
  align-items: center;
  margin-bottom: 20;
`;

/**
 * @class SpotBookingPage
 * @extends {React.PureComponent}
 */
class SpotBookingPage extends React.PureComponent {
  /**
   * @constructor
   * @constructs SpotBookingPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.handleNavigateToCart = this.handleNavigateToCart.bind(this);
  }
  /**
   * @returns {JSX.Element} HTML
   */
  handleNavigateToCart() {
    this.props.setCurrentSpotBookingEventId(null);
    this.props.navigation.navigate(CART_ROUTE);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (!this.props.event) {
      return null;
    }

    const spotName = this.props.studioSpotLabel || 'Spot';

    return (
      <FadeInView>
        <Header
          title={`Choose a ${spotName}`}
          headerStyle={{ width: WIDTH }}
          spotBookingOpened={this.props.spotBookingOpened}
          closePickingSpotsModal={this.props.closePickingSpotsModal}
          showCart={false}
        />
        <ScrollView contentContainerStyle={{ alignItems: 'center', height: HEIGHT, marginTop: 20, marginBottom: 20 }}>
          <InfoView>
            <HeavyText>
              {this.props.formattedTimes.startTimeDate}
            </HeavyText>
            <NormalText>
              {this.props.formattedTimes.startTimeHourMinute} @ {this.props.event.locationName}
            </NormalText>
          </InfoView>
          <InfoView>
            <HeavyText>
              {this.props.event.name}
            </HeavyText>
            <NormalText>
              Instructor: {this.props.event.instructorName}
            </NormalText>
          </InfoView>
          <SpotBookingEventListItem
            event={this.props.event}
            getRoomForEvent={this.props.getRoomForEvent}
            spots={this.props.getSpotGridForEventWithSetter(this.props.event.eventid)}
            roomItems={this.props.getRoomItemsWithSetter(this.props.event.eventid)}
            setSpotInCart={this.props.setSpotInCart}
            removeSpotFromCart={this.props.removeSpotFromCart}
            spotBookingOpened={this.props.spotBookingOpened}
            addEventToCart={this.props.addEventToCart}
          />
        </ScrollView>
        <SwipableButton
          swipeText={`Swipe to ${this.props.userHasPickedAllSpots ? 'continue' : 'skip'}`}
          notReadyForPurchase={!this.props.event.room}
          onLeftButtonsActivate={this.handleNavigateToCart}
        />
      </FadeInView>
    );
  }
}

SpotBookingPage.propTypes = {
  event: PropTypes.shape(),
  getRoomForEvent: PropTypes.func,
  getSpotGridForEventWithSetter: PropTypes.func,
  setSpotInCart: PropTypes.func,
  removeSpotFromCart: PropTypes.func,
  spotBookingOpened: PropTypes.bool,
  closePickingSpotsModal: PropTypes.func,
  userHasPickedAllSpots: PropTypes.bool,
  navigation: PropTypes.shape(),
  setCurrentSpotBookingEventId: PropTypes.func,
  formattedTimes: PropTypes.shape(),
  addEventToCart: PropTypes.func,
  studioSpotLabel: PropTypes.string,
  getRoomItemsWithSetter: PropTypes.func,
};

const mapStateToProps = state => ({
  event: getCurrentSpotBookingEvent(state),
  events: getEventsData(state),
  getSpotGridForEventWithSetter: getSpotGridForEventWithSetter(state),
  userHasPickedAllSpots: getAllSpotBookingSpotsPicked(state),
  formattedTimes: getCurrentSpotBookingEventFormattedTimes(state),
  studioSpotLabel: getStudioSpotLabel(state),
  getRoomItemsWithSetter: getRoomItemsWithSetter(state),
});

const mapDispatchToProps = {
  getRoomForEvent,
  setSpotInCart,
  removeSpotFromCart,
  addEventToCart,
  setCurrentSpotBookingEventId,
};

const SpotBookingPageWithNavigation = withNavigation(SpotBookingPage);
export default connect(mapStateToProps, mapDispatchToProps)(SpotBookingPageWithNavigation);
