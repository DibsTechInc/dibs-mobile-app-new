import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, TouchableOpacity } from 'react-native';
import { LIGHT_GREY, TEXT_GREY, BLACK, SOFT_GREY, TRANSPARENT } from '../../../constants';
import { fadeColor } from '../../../helpers';
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
    this.props.addToCart();
  }
  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeItem();
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
              {(this.props.maxSeatsReached || this.props.fromPackage) ? (
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
  quantity: PropTypes.number,
  maxSeatsReached: PropTypes.bool,
  addToCart: PropTypes.func,
  removeItem: PropTypes.func,
  fromPackage: PropTypes.bool,
};

export default Overlay;
