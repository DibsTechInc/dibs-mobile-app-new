import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

/**
 * @class DrawerItem
 * @extends PureComponent
 */
class DrawerItem extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <TouchableOpacity
        style={{ paddingHorizontal: 20 }}
        onPress={this.props.onPress}
      >
        <Icon name={this.props.iconName} size={20} color="#fff" />
      </TouchableOpacity>
    );
  }
}

DrawerItem.propTypes = {
  iconName: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default DrawerItem;
