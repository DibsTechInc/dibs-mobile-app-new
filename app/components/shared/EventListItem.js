import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { WHITE, LIGHT_GREY, DARK_TEXT_GREY, BLACK, GREY } from '../../constants';
import { addEventToCart, removeOneEventItem, enqueueNotice } from '../../actions';
import { FlexRow, FlexCenter, RightAlignedColumn, HeavyText, NormalText } from '../styled';
import Button from './PurchaseItem/Button';
import Overlay from './PurchaseItem/Overlay';

const Container = styled(FlexRow)`
  background: ${WHITE},
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  overflow: hidden;
  padding-top: 20;
  padding-bottom: ${props => (props.showOverlay ? 40 : 20)};
  position: relative;
`;

const PriceColumn = styled(FlexCenter)`
  flex-basis: 25%;
`;

const CenterColumn = styled.View`
  flex-basis: ${props => (props.isCartEvent ? '70%' : '45%')};
  margin-left: ${props => (props.isCartEvent ? '5%' : 0)};
  padding-horizontal: 5;
`;

const ButtonColumn = styled(FlexCenter)`
  flex-basis: 30%;
`;

const Price = styled(HeavyText)`
  font-size: 20;
`;

const ScheduleText = styled(NormalText)`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
`;

/**
 * for SchedulePage and CartPage
 * @class EventListItem
 * @extends {React.PureComponent}
 */
class EventListItem extends React.PureComponent {
  /**
   * @constructor
   * @constructs EventListItem
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { showOverlay: false };
    this.showOverlayAndStartTimer = this.showOverlayAndStartTimer.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
  }
  /**
   * @param {Object} props component will get
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.quantity !== this.props.quantity && props.quantity) {
      this.showOverlayAndStartTimer();
    }
    if (!props.quantity) {
      this.setState({ showOverlay: false });
    }
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
  }
  /**
   * @returns {undefined}
   */
  addToCart() {
    if (this.props.custom_attributes
      && this.props.custom_attributes.notice_message) {
      this.props.enqueueNotice({
        message: this.props.custom_attributes.notice_message,
        buttons: [
          { text: 'OK', onPress: () => { } },
        ],
      });
    }

    this.props.addEventToCart({
      eventid: this.props.eventid,
      passid: this.props.passid,
      price: this.props.price,
    });
  }
  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeOneEventItem(this.props.eventid);
  }
  /**
   * @returns {undefined}
   */
  showOverlayAndStartTimer() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
    this.setState({ showOverlay: true });
    this.overlayTimeout = setTimeout(() => {
      this.setState({ showOverlay: false });
      this.overlayTimeout = null;
    }, 5000);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const spotName = this.props.studioSpotLabel || 'Spot';
    let lastRoomSpot;
    if (this.props.studioHasSpotBooking && this.props.spotIds.length) {
      lastRoomSpot = `${spotName} ${this.props.lastRoomSpot.source_id}`;
    }

    return (
      <Container showOverlay={this.state.showOverlay}>
        {(
          (this.props.soldOut && !this.props.waitlisted && !this.props.has_waitlist)
          || this.state.showOverlay
        ) ? (
            <Overlay
              {...this.props}
              removeItem={this.removeFromCart}
              addToCart={this.addToCart}
            />
          ) : null}
        {this.props.isCartEvent ? null : (
          <PriceColumn>
            {this.props.passid ? (
              <RightAlignedColumn>
                <ScheduleText>
                  Credit back
                </ScheduleText>
                <Price style={{ fontSize: 16 }}>
                  +{this.props.formattedValueBack}
                </Price>
              </RightAlignedColumn>
            ) : (
                <Price>
                  {this.props.formattedRoundedPrice}
                </Price>
              )}
          </PriceColumn>
        )}
        <CenterColumn isCartEvent={this.props.isCartEvent}>
          <View style={{ marginBottom: 10 }}>
            <HeavyText>
              {this.props.isCartEvent ?
                `${this.props.shortDayOfWeek} ${this.props.shortEventDate}`
                : `${this.props.startTimeInLocalTZ} - ${this.props.endTimeInLocalTZ}`
              }
            </HeavyText>
            {this.props.isCartEvent ? (
              <ScheduleText numberOfLines={1}>
                {this.props.startTimeInLocalTZ} - {this.props.endTimeInLocalTZ}
              </ScheduleText>
            ) : null}
            <ScheduleText numberOfLines={1}>
              {this.props.locationName}
            </ScheduleText>
          </View>
          <View>
            <HeavyText numberOfLines={1}>
              {this.props.name}
            </HeavyText>
            <ScheduleText numberOfLines={1}>
              {this.props.instructorName}
            </ScheduleText>
            {this.props.isCartEvent ? (
              <ScheduleText numberOfLines={1} style={{ color: this.props.isCartEvent ? GREY : BLACK }}>
                {this.props.formattedRoundedPrice}
              </ScheduleText>
            ) : null}
            {this.props.isCartEvent && this.props.studioHasSpotBooking ? <ScheduleText numberOfLines={1} style={{ color: GREY }}>
              {this.props.spotIds.length ? lastRoomSpot : `No ${spotName} Selected`}
            </ScheduleText> : undefined}
          </View>
        </CenterColumn>
        <ButtonColumn>
          <Button
            {...this.props}
            showOverlay={this.showOverlayAndStartTimer}
            addToCart={this.addToCart}
          />
        </ButtonColumn>
      </Container>
    );
  }
}

EventListItem.defaultProps = {
  has_waitlist: false,
  isCartEvent: false,
  waitlisted: false,
};

EventListItem.propTypes = {
  eventid: PropTypes.number,
  shortDayOfWeek: PropTypes.string,
  shortEventDate: PropTypes.string,
  formattedRoundedPrice: PropTypes.string.isRequired,
  passid: PropTypes.number,
  formattedValueBack: PropTypes.string,
  name: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
  startTimeInLocalTZ: PropTypes.string.isRequired,
  endTimeInLocalTZ: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
  soldOut: PropTypes.bool.isRequired,
  waitlisted: PropTypes.bool,
  has_waitlist: PropTypes.bool,
  quantity: PropTypes.number.isRequired,
  isCartEvent: PropTypes.bool,
  studioHasSpotBooking: PropTypes.bool,
  spotIds: PropTypes.arrayOf(PropTypes.number),
  lastRoomSpot: PropTypes.shape(),
  addEventToCart: PropTypes.func.isRequired,
  removeOneEventItem: PropTypes.func,
  price: PropTypes.number,
  studioSpotLabel: PropTypes.string,
  enqueueNotice: PropTypes.func,
  custom_attributes: PropTypes.shape(),
};

const mapDispatchToProps = {
  addEventToCart,
  removeOneEventItem,
  enqueueNotice,
};

export default connect(null, mapDispatchToProps)(EventListItem);
