import React, { Component } from 'react';
import { NavigationActions, withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { DRAWER_OPEN, WHITE, DARK_TEXT_GREY } from '../../constants';
import CartIcon from '../shared/CartIcon';
import Icon from '../shared/Icon';

const StyledView = styled.View`
  background-color: ${props => props.backgroundColor};
  height: 50;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  margin-top: 15;
`;

const StyledMenuView = styled.View`
  margin-left: 5;
`;

const StyledCartView = styled.View`
  margin-right: 5;
`;

const StyledTitleView = styled.View`
  margin-right: ${props => (props.titleWithNoCart ? '15%' : '1%')};
`;

const StyledText = styled.Text`
  font-family: flex-font-heavy;
  color: ${props => (props.textColor ? props.textColor : DARK_TEXT_GREY)}
`;

/**
 * @class Header
 * @param {string} route the navigation route
 * @extends {Component}
 */
class Header extends Component {
  /**
   * @constructor
   * @constructs Header
   */
  constructor() {
    super();

    this.navigateToDrawer = this.navigateToDrawer.bind(this);
  }
  /**
   * @returns {undefined}
   */
  navigateToDrawer() {
    const navigateAction = NavigationActions.navigate({
      routeName: DRAWER_OPEN,
    });

    const keyType = this.props.navigation.state.key.split('-')[0];
    const popTop = NavigationActions.popToTop();

    if (keyType === 'id') {
      this.props.navigation.dispatch(popTop);
    } else {
      this.props.navigation.dispatch(navigateAction);
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView backgroundColor={this.props.backgroundColor}>
        <StyledMenuView>
          <Icon
            iconName="user-circle"
            iconColor={this.props.iconColor}
            onPress={this.navigateToDrawer}
          />
        </StyledMenuView>
        <StyledTitleView titleWithNoCart={this.props.titleWithNoCart}>
          {this.props.showTitle && (
            <StyledText textColor={this.props.textColor}>
              {this.props.titleText}
            </StyledText>
          )}
        </StyledTitleView>
        <StyledCartView>
          {this.props.showCart && <CartIcon iconColor={this.props.iconColor} />}
        </StyledCartView>
      </StyledView>
    );
  }
}

Header.defaultProps = {
  showCart: true,
  showTitle: false,
  titleText: 'Title Text',
  backgroundColor: WHITE,
};

Header.propTypes = {
  navigation: PropTypes.shape(),
  iconColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  showCart: PropTypes.bool,
  titleWithNoCart: PropTypes.bool,
  showTitle: PropTypes.bool,
  textColor: PropTypes.string,
  titleText: PropTypes.string,
};

export default withNavigation(Header);

