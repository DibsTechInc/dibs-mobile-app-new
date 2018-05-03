import React, { Component } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { getTotalQuantityInCart } from '../../selectors';
import { CART_ROUTE, DRAWER_OPEN } from '../../constants/RouteConstants';
import Icon from '../shared/Icon';

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

const StyledTitleView = styled.View`
  margin-right: ${props => props.titleWithNoCart ? '15%' : '1%'};
`;

const StyledText = styled.Text`
  font-family: flex-font-heavy;
  color: ${props => props.textColor ? props.textColor : '#000'}
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
          <Icon
            iconName="align-center"
            iconColor={this.props.iconColor}
            onPress={() => this.props.navigation.navigate(DRAWER_OPEN)}
          />
        </StyledMenuView>
        <StyledTitleView titleWithNoCart={this.props.titleWithNoCart}>
          {this.props.showTitle && <StyledText textColor={this.props.textColor}>{this.props.titleText}</StyledText>}
        </StyledTitleView>
        <StyledCartView>
          {this.props.showCart && <Icon
            iconName="shopping-cart"
            iconColor={this.props.iconColor}
            onPress={() => this.props.navigation.navigate(CART_ROUTE)}
            notification={{
              notificationCount: this.props.quantityInCart,
            }}
          />
          }
        </StyledCartView>
      </StyledView>
    );
  }
}

Header.defaultProps = {
  showCart: true,
  showTitle: false,
  titleText: 'Title Text',
};

Header.propTypes = {
  navigation: PropTypes.shape(),
  iconColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  quantityInCart: PropTypes.number,
  showCart: PropTypes.bool,
  titleWithNoCart: PropTypes.bool,
  showTitle: PropTypes.bool,
  textColor: PropTypes.string,
  titleText: PropTypes.string,
};

const mapStateToProps = state => ({
  quantityInCart: getTotalQuantityInCart(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Header);

