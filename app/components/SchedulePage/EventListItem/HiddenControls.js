import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Config from '../../../../config.json';
import { addToCart, removeOneEventItem } from '../../../actions';
import { LIGHT_GREY, WHITE } from '../../../constants';
import Icon from '../../shared/Icon';

const StyledHiddenItemView = styled.View`
  align-items: flex-end;
  background-color: ${Config.STUDIO_COLOR};
  flex: 1;
  justify-content: center;
`;

const StyledTouchable = styled.TouchableOpacity`
  align-items: center;
  background-color: ${WHITE};
  border-radius: 20;
  border-bottom-width: 3;
  border-right-width: 2;
  border-left-width: 1;
  border-color: ${LIGHT_GREY};
  height: 40;
  justify-content: center;
  margin-right: 20;
  width: 40;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 3;
  elevation: 3;
  margin-bottom: ${props => props.quantity ? 10 : 0};
`;

const StyledHiddenItemText = styled.Text`
  color: ${Config.STUDIO_COLOR};
  justify-content: center;
  font-family: 'flex-font-heavy';
  font-size: 32px;
`;

/**
 * @classHiddenControls
 * @extends {React.PureComponent}
 */
class HiddenControls extends React.PureComponent {
  /**
   * @constructor
   * @constructs HiddenControls
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.addItemToCart = this.addItemToCart.bind(this);
    this.removeItemFromCart = this.removeItemFromCart.bind(this);
  }
  /**
   * @returns {undefined}
   */
  addItemToCart() {
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
  removeItemFromCart() {
    this.props.removeOneEventItem(this.props.eventid);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <StyledHiddenItemView>
        {!this.props.maxSeatsReached && (
          <StyledTouchable
            onPress={this.addItemToCart}
            quantity={this.props.quantity}
            style={{ shadowOffset: { width: 3, height: 3 } }}
          >
            <StyledHiddenItemText>
              <Icon
                iconName="plus"
                size={15}
                iconColor={Config.STUDIO_COLOR}
              />
            </StyledHiddenItemText>
          </StyledTouchable>
        )}
        {this.props.quantity && (
          <StyledTouchable onPress={this.removeItemFromCart}>
            <StyledHiddenItemText>
              <Icon
                iconName="minus"
                size={15}
                iconColor={Config.STUDIO_COLOR}
              />
            </StyledHiddenItemText>
          </StyledTouchable>
        )}
      </StyledHiddenItemView>
    );
  }
}

HiddenControls.propTypes = {
  addToCart: PropTypes.func,
  removeOneEventItem: PropTypes.func,
  eventid: PropTypes.number,
  passid: PropTypes.number,
  price: PropTypes.number,
  taxRate: PropTypes.number,
  name: PropTypes.string,
  start_time: PropTypes.string,
  quantity: PropTypes.number,
  maxSeatsReached: PropTypes.bool,
};

const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

export default connect(null, mapDispatchToProps)(HiddenControls);
