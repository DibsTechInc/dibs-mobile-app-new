import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Config from '../../../../config.json';
import { addToCart, removeOneEventItem } from '../../../actions';
import { WHITE } from '../../../constants';

const StyledHiddenItemView = styled.View`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  padding: 0px 20px;
`;

const StyledHiddenItemText = styled.Text`
  color: ${WHITE};
  justify-content: center;
  font-family: 'flex-font-heavy';
  font-size: 32px;
`;

const StyledTouchable = styled.TouchableOpacity`
  align-items: center;
  border: solid 2px ${WHITE}
  border-radius: 25;
  height: 50;
  justify-content: center;
  width: 50;
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
        <StyledTouchable onPress={this.removeItemFromCart}>
          <StyledHiddenItemText>
            -
          </StyledHiddenItemText>
        </StyledTouchable>
        <StyledTouchable onPress={this.addItemToCart}>
          <StyledHiddenItemText>
            +
          </StyledHiddenItemText>
        </StyledTouchable>
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
};

const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

export default connect(null, mapDispatchToProps)(HiddenControls);
