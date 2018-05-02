import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Config from '../../../../config.json';
import { addToCart, removeOneEventItem } from '../../../actions';

const StyledHiddenItemView = styled.View`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  padding-right: 40;
  padding-left: 40;
`;

const StyledHiddenItemText = styled.Text`
  color: #fff;
  justify-content: center;
  font-family: 'flex-font-heavy';
  font-size:
`;

const StyledTouchable = styled.TouchableOpacity`
  align-items: center;
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
  }
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
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <StyledHiddenItemView>
        <StyledTouchable>
          <StyledHiddenItemText>
            Drop class
          </StyledHiddenItemText>
        </StyledTouchable>
        <StyledTouchable onPress={this.addItemToCart}>
          <StyledHiddenItemText>
            Add to cart
          </StyledHiddenItemText>
        </StyledTouchable>
      </StyledHiddenItemView>
    );
  }
}

HiddenControls.propTypes = {
  addToCart: PropTypes.func,
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
