import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { LIGHT_GREY, WHITE, TEXT_GREY, BLACK } from '../../../../constants';
import { fadeColor } from '../../../../helpers';
import { addToCart, removeOneEventItem } from '../../../../actions';
import { Overlay as StyledOverlay, FlexRow } from '../../../styled';
import Icon from '../../../shared/Icon';

const EventOverlay = StyledOverlay.extend`
  background: ${props => props.background};
  elevation: 3;
  justify-content: flex-end;
  shadow-color: ${BLACK};
  shadow-opacity: 0.075;
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

const Quantity = styled.Text`
  color: ${TEXT_GREY};
  font-family: 'flex-font';
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
          fadeColor(WHITE, 0.4) : fadeColor(WHITE, 0.75)
        }
      >
        {this.props.quantity ? (
          <ControlsContainer>
            <CartControls>
              <IconContainer>
                <Icon
                  size={15}
                  iconName={this.props.quantity > 1 ? 'minus' : 'trash'}
                  iconColor={TEXT_GREY}
                  padding={10}
                  onPress={this.removeFromCart}
                />
              </IconContainer>
              <Quantity>
                {this.props.quantity}
              </Quantity>
              {this.props.maxSeatsReached ? (
                <View style={{ width: 50, height: 15 }} />
              ) : (
                <IconContainer>
                  <Icon
                    size={15}
                    iconName="plus"
                    iconColor={TEXT_GREY}
                    padding={10}
                    onPress={this.addToCart}
                  />
                </IconContainer>
              )}
            </CartControls>
          </ControlsContainer>
        ) : null}
      </EventOverlay>
    );
  }
}

Overlay.propTypes = {
  soldOut: PropTypes.bool.isRequired,
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
};

const mapStateToProps = null; // state => ({});
const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(Overlay);
