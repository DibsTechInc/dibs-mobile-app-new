import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { LIGHT_GREY, TEXT_GREY, BLACK, SOFT_GREY, TRANSPARENT } from '../../../constants';
import { fadeColor } from '../../../helpers';
import { addToCart, removeOneEventItem } from '../../../actions';
import { Overlay as StyledOverlay, FlexRow, NormalText } from '../../styled';
import { TrashIcon, MinusIcon, PlusIcon } from '../../shared';

const EventOverlay = StyledOverlay.extend`
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

const CartControls = FlexRow.extend`
  align-items: center;
  height: 30;
  justify-content: space-between;
  width: ${200 / 3}%;
`;

const IconContainer = styled.View`
  align-items: center;
  width: 50;
`;

const Quantity = NormalText.extend`
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
    this.props.addToCart({
      eventid: this.props.eventid,
      passid: this.props.passid,
      price: this.props.price,
      taxRate: this.props.taxRate,
      name: this.props.name,
      start_time: this.props.start_time,
      locationName: this.props.locationName,
      instructorName: this.props.instructorName,
    });
  }
  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeOneEventItem(this.props.eventid);
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
                  {this.props.quantity > 1 ? (
                    <MinusIcon />
                  ) : (
                    <TrashIcon />
                  )}
                </TouchableOpacity>
              </IconContainer>
              <Quantity>
                {this.props.quantity}
              </Quantity>
              {this.props.maxSeatsReached ? (
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
};

Overlay.propTypes = {
  soldOut: PropTypes.bool,
  quantity: PropTypes.number.isRequired,
  maxSeatsReached: PropTypes.bool.isRequired,
  addToCart: PropTypes.func.isRequired,
  eventid: PropTypes.number.isRequired,
  passid: PropTypes.number,
  price: PropTypes.number.isRequired,
  taxRate: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  start_time: PropTypes.string.isRequired,
  removeOneEventItem: PropTypes.func.isRequired,
  locationName: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
};

const mapStateToProps = null; // state => ({});
const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(Overlay);
