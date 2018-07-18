import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import { Image, TouchableOpacity } from 'react-native';

import { CART_ROUTE, MAIN_ROUTE } from '../../../constants';
import { getTotalQuantityInCart } from '../../../selectors';
import Notification from '../Notification';

import WhiteCartImg from '../../../../assets/img/cart-white.png';
import GreyCartImg from '../../../../assets/img/cart-grey.png';

/**
 * @class CartIcon
 * @extends {React.PureComponent}
 */
class CartIcon extends React.PureComponent {
  /**
   * @constructor
   * @constructs CartIcon
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.openCart = this.openCart.bind(this);
  }
  /**
   * @returns {undefined}
   */
  openCart() {
    if (this.props.navigation.state.key === CART_ROUTE) return;

    this.props.navigation.navigate(CART_ROUTE, {
      previousRoute: this.props.fromSideMenu ? MAIN_ROUTE : this.props.navigation.state.key,
    });
  }
  /**
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={this.openCart}
      >
        <Notification
          notificationCount={this.props.quantityInCart}
          right={2}
        >
          <Image
            source={this.props.fromSideMenu ? GreyCartImg : WhiteCartImg}
            style={{ width: 25, height: 25, margin: 20 }}
            resizeMode="contain"
          />
        </Notification>
      </TouchableOpacity>
    );
  }
}

CartIcon.defaultProps = { fromSideMenu: false };

CartIcon.propTypes = {
  quantityInCart: PropTypes.number.isRequired,
  navigation: PropTypes.shape().isRequired,
  fromSideMenu: PropTypes.bool,
};

const mapStateToProps = state => ({
  quantityInCart: getTotalQuantityInCart(state),
});
const mapDispatchToProps = {};

export default compose(withNavigation, connect(mapStateToProps, mapDispatchToProps))(CartIcon);
