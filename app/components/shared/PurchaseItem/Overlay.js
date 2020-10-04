import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, TouchableOpacity } from 'react-native';
import { LIGHT_GREY, TEXT_GREY, BLACK, SOFT_GREY, TRANSPARENT } from '../../../constants';
import { fadeColor } from '../../../helpers';
import {
  setCurrentSpotBookingEventId,
  setCartEventsData,
} from '../../../actions';
import { getStudioHasSpotBooking } from '../../../selectors';
import { Overlay as StyledOverlay, FlexRow, NormalText } from '../../styled';
import { TrashIcon, MinusIcon, PlusIcon } from '../../shared';

const EventOverlay = styled(StyledOverlay)`
  background-color: ${props => props.background};
  elevation: 3;
  justify-content: flex-end;
  shadow-color: ${BLACK};
  shadow-opacity: 0.05;
  shadow-radius: 2;
  z-index: 3;
`;

const ControlsContainer = styled.View`
  align-items: center;
  background: ${LIGHT_GREY};
  height: 30;
  width: 100%;
  z-index: 5;
`;

const CartControls = styled(FlexRow)`
  align-items: center;
  height: 30;
  justify-content: space-between;
  width: ${200 / 3}%;
`;

const IconContainer = styled.View`
  align-items: center;
  width: 50;
`;

const Quantity = styled(NormalText)`
  color: ${TEXT_GREY};
  font-size: 16;
`;

/**
 * @class Overlay
 * @extends {React.PureComponent}
 */
class Overlay extends React.PureComponent {
  /**
   * @constructor
   * @constructs Overlay
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.addToCart = this.addToCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
  }
  /**
   * @returns {undefined}
   */
  addToCart() {
    this.props.addToCart();
    if (this.props.studioHasSpotBooking) {
      this.props.setCurrentSpotBookingEventId(this.props.eventid);
    }
  }
  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeItem();
    if (this.props.studioHasSpotBooking) {
      return this.props.setCartEventsData([]);
    }

    return null;
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <EventOverlay
        background={this.props.soldOut ?
          fadeColor(SOFT_GREY, 0.4) : TRANSPARENT
        }
      >
        {this.props.quantity ? (
          <ControlsContainer>
            <CartControls>
              <IconContainer>
                <TouchableOpacity activeOpacity={1} onPress={this.removeFromCart}>
                  {(this.props.quantity > 1) ? (
                    <MinusIcon />
                  ) : (
                    <TrashIcon />
                  )}
                </TouchableOpacity>
              </IconContainer>
              <Quantity>
                {this.props.quantity}
              </Quantity>
              {(this.props.maxSeatsReached || this.props.fromPackage || this.props.studioHasSpotBooking) ? (
                <View style={{ width: 50, height: 15 }} />
              ) : (
                <IconContainer>
                  <TouchableOpacity activeOpacity={1} onPress={this.addToCart}>
                    <PlusIcon />
                  </TouchableOpacity>
                </IconContainer>
              )}
            </CartControls>
          </ControlsContainer>
        ) : null}
      </EventOverlay>
    );
  }
}

Overlay.defaultProps = {
  soldOut: false,
  fromPackage: false,
};

Overlay.propTypes = {
  soldOut: PropTypes.bool,
  quantity: PropTypes.number.isRequired,
  maxSeatsReached: PropTypes.bool,
  addToCart: PropTypes.func.isRequired,
  eventid: PropTypes.number,
  setCurrentSpotBookingEventId: PropTypes.func,
  studioHasSpotBooking: PropTypes.bool,
  setCartEventsData: PropTypes.func,
  removeItem: PropTypes.func,
  fromPackage: PropTypes.bool,
};

const mapStateToProps = state => ({
  studioHasSpotBooking: getStudioHasSpotBooking(state),
  currentSpotBookingEventId: state.events.currentSpotBookingEventId,
});

const mapDispatchToProps = {
  setCurrentSpotBookingEventId,
  setCartEventsData,
};

export default connect(mapStateToProps, mapDispatchToProps)(Overlay);

