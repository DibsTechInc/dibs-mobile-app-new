import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/FontAwesome';
import styled from 'styled-components';
import Notification from './Notification';

const IconText = styled.Text`
  padding-horizontal: ${props => props.padding};
  padding-vertical: ${props => props.padding};
  z-index: 0;
`;

/**
 * @class DrawerItem
 * @extends PureComponent
 */
class IconComponent extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Notification {...this.props.notification}>
        <IconText {...this.props} onPress={this.props.onPress}>
          <Icon
            name={this.props.iconName}
            size={this.props.size}
            color={this.props.iconColor}
            padding={this.props.padding}
            {...this.props}
          />
        </IconText>
      </Notification>
    );
  }
}

IconComponent.defaultProps = {
  iconColor: '#000',
  size: 25,
  padding: 20,
  onPress() {},
};

IconComponent.propTypes = {
  iconName: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  iconColor: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  notification: PropTypes.shape(),
  padding: PropTypes.number.isRequired,
};

export default IconComponent;
