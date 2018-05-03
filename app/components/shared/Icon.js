import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/FontAwesome';
import styled from 'styled-components';
import Notification from './Notification';

const StyledTouchable = styled.Text`
  padding-horizontal: 20;
  padding-vertical: 20;
  z-index: 0;
`;

/**
 * @class DrawerItem
 * @extends PureComponent
 */
class IconComponent extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Notification {...this.props.notification}>
        <StyledTouchable {...this.props} onPress={this.props.onPress}>
          <Icon
            name={this.props.iconName}
            size={this.props.size}
            color={this.props.iconColor}
            {...this.props}
          />
        </StyledTouchable>
      </Notification>
    );
  }
}

IconComponent.defaultProps = {
  iconColor: '#000',
  size: 25,
  hasNotification: false,
  onPress() {},
};

IconComponent.propTypes = {
  iconName: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  iconColor: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  notification: PropTypes.shape(),
};

export default IconComponent;
