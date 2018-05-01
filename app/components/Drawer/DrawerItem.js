import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/FontAwesome';
import styled from 'styled-components';

const StyledView = styled.View`
  position: relative;
`;

const StyledNotification = styled.View`
  justify-content: center;
  align-items: center;
  background-color: red;
  z-index: 1;
  border-radius: 10;
  margin-right: 5;
  width: 20;
  height: 20;
  position: absolute;
  right: 7;
  top: 10;
`;

const StyledNotificationText = styled.Text`
  font-family: flex-font;
  color: #fff;
`;

const StyledTouchable = styled.Text`
  padding-horizontal: 20;
  padding-vertical: 20;
  z-index: 0;
`;

/**
 * @class DrawerItem
 * @extends PureComponent
 */
class DrawerItem extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.props.hasNotification) {
      return (
        <StyledView>
          <StyledNotification>
            <StyledNotificationText>{this.props.cartCount}</StyledNotificationText>
          </StyledNotification>
          <StyledTouchable
            onPress={this.props.onPress}
          >
            <Icon name={this.props.iconName} size={this.props.size} color={this.props.iconColor} />
          </StyledTouchable>
        </StyledView>
      );
    }

    return (
      <StyledTouchable
        onPress={this.props.onPress}
      >
        <Icon name={this.props.iconName} size={this.props.size} color={this.props.iconColor} />
      </StyledTouchable>
    );
  }
}

DrawerItem.defaultProps = {
  iconColor: '#000',
  size: 25,
  hasNotification: false,
  cartCount: 2,
};

DrawerItem.propTypes = {
  iconName: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  iconColor: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  hasNotification: PropTypes.bool,
  cartCount: PropTypes.number,
};

export default DrawerItem;
