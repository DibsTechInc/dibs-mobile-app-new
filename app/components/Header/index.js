import React, { Component } from 'react';
import { Alert } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { getTotalQuantityInCart } from '../../selectors';

import DrawerItem from '../shared/Icon';

const StyledView = styled.View`
  height: 50;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  background-color: ${props => (props.backgroundColor ? props.backgroundColor : '#fff')}
  margin-top: 35;
`;

const StyledMenuView = styled.View`
  margin-left: 5;
`;

const StyledCartView = styled.View`
  margin-right: 5;
`;

/**
 * @class Header
 * @extends {Component}
 */
class Header extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView backgroundColor={this.props.backgroundColor}>
        <StyledMenuView>
          <DrawerItem
            iconName="align-center"
            iconColor={this.props.iconColor}
            onPress={() => this.props.navigation.navigate('DrawerOpen')}
          />
        </StyledMenuView>
        <StyledCartView>
          <DrawerItem
            iconName="shopping-cart"
            iconColor={this.props.iconColor}
            onPress={() => Alert.alert('This will take you to the shopping cart page!')}
            notificationCount={this.props.quantityInCart}
          />
        </StyledCartView>
      </StyledView>
    );
  }
}

Header.propTypes = {
  navigation: PropTypes.shape(),
  iconColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  quantityInCart: PropTypes.number,
};

const mapStateToProps = state => ({
  quantityInCart: getTotalQuantityInCart(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Header);

