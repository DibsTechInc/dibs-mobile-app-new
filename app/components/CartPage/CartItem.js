import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View } from 'react-native';
import { format as formatCurrency } from 'currency-formatter';

import { addToCart, removeOneEventItem } from '../../actions';
import { getStudioCurrency } from '../../selectors';
import { TEXT_GREY, GREY, DARK_TEXT_GREY } from '../../constants';
import Icon from '../shared/Icon';
import Config from '../../../config.json';
import { MaterialPanelView, HeavyText, NormalText } from '../styled';

const StyledCartView = styled.View`
  justify-content: space-between;
  flex: 1;
  margin: 10px;
`;

const StyledCartQuantityView = styled.View`
  border-width: 1px;
  width: 30px;
  height: 30px;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  border-color: ${Config.STUDIO_COLOR};
  margin: 10px;
`;

const DarkGreyNormalText = NormalText.extend`
  color: ${DARK_TEXT_GREY};
`;

const GreyNormalText = NormalText.extend`
  color: ${GREY}
`;

/**
 * @class CartItem
 * @extends {PureComponent}
 */
class CartItem extends PureComponent {
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
      startTime: this.props.startTime,
    });
  }

  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeOneEventItem(this.props.eventid);
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const timeFormat = Config.STUDIO_TZ === 'Europe/London' ? moment(this.props.startTime).format('hh:mm [@ ]') : moment(this.props.startTime).format('h:mm A z [@ ]');
    const timeDisplay = `${timeFormat} ${this.props.locationName}`;

    return (
      <MaterialPanelView style={{ flexDirection: 'row', marginTop: 0 }}>
        <StyledCartView>
          <View style={{ marginBottom: 10 }}>
            <HeavyText>
              {moment(this.props.startTime).format('ddd M/D')
            }</HeavyText>
            <DarkGreyNormalText>
              {timeDisplay}
            </DarkGreyNormalText>
          </View>
          <View>
            <HeavyText>{this.props.name}</HeavyText>
            <DarkGreyNormalText>{this.props.instructorName}</DarkGreyNormalText>
            <GreyNormalText>{formatCurrency(this.props.price, { code: this.props.currency, precision: (this.props.price % 1 && 2) })}</GreyNormalText>
          </View>
        </StyledCartView>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {this.props.showCartAdjustments && <Icon
            size={15}
            iconName={this.props.quantity > 1 ? 'minus' : 'trash'}
            iconColor={TEXT_GREY}
            padding={10}
            onPress={this.removeFromCart}
          />}
          <StyledCartQuantityView>
            <NormalText style={{ fontSize: 16 }}>{this.props.quantity}</NormalText>
          </StyledCartQuantityView>
          {this.props.showCartAdjustments && this.props.quantity <= 3 && <Icon
            size={15}
            iconName="plus"
            iconColor={TEXT_GREY}
            padding={10}
            onPress={this.addToCart}
          />}
        </View>
      </MaterialPanelView>
    );
  }
}

CartItem.defaultProps = {
  showCartAdjustments: true,
};

CartItem.propTypes = {
  name: PropTypes.string,
  quantity: PropTypes.number,
  passid: PropTypes.number,
  price: PropTypes.number,
  startTime: PropTypes.string,
  taxRate: PropTypes.number,
  eventid: PropTypes.number,
  removeOneEventItem: PropTypes.func,
  addToCart: PropTypes.func,
  showCartAdjustments: PropTypes.bool,
  currency: PropTypes.string,
  locationName: PropTypes.string,
  instructorName: PropTypes.string,
};

const mapDispatchToProps = {
  addToCart,
  removeOneEventItem,
};

const mapStateToProps = state => ({
  currency: getStudioCurrency(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(CartItem);
