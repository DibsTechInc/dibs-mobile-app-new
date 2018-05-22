import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import { CART_ROUTE } from '../../constants';
import { getTotalQuantityInCart } from '../../selectors';
import Icon from './Icon';

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
    this.props.navigation.navigate(CART_ROUTE, { previousRoute: this.props.navigation.state.key });
  }
  /**
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Icon
        iconName="shopping-cart"
        iconColor={this.props.iconColor}
        onPress={this.openCart}
        notification={{
          notificationCount: this.props.quantityInCart,
        }}
      />
    );
  }
}

CartIcon.propTypes = {
  quantityInCart: PropTypes.number.isRequired,
  iconColor: PropTypes.string.isRequired,
  navigation: PropTypes.shape().isRequired,
};

const mapStateToProps = state => ({
  quantityInCart: getTotalQuantityInCart(state),
});
const mapDispatchToProps = {};

export default compose(withNavigation, connect(mapStateToProps, mapDispatchToProps))(CartIcon);
