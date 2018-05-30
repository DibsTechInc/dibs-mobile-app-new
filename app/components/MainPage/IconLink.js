import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withNavigation } from 'react-navigation';
import { View } from 'react-native';

import { WHITE } from '../../constants';
import { HeavyText } from '../styled';

const Link = styled.TouchableOpacity`
  align-items: ${props => props.alignItems};
  justify-content: space-between;
`;

const LinkText = HeavyText.extend`
  text-align: center;
  color: ${WHITE};
  font-size: 16;
  margin-top: -10;
`;

/**
 * @class IconLink
 * @extends {React.PureComponent}
 */
class IconLink extends React.PureComponent {
  /**
   * @constructor
   * @constructs IconLink
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.onPress = this.onPress.bind(this);
  }
  /**
   * @returns {undefined}
   */
  onPress() {
    this.props.navigation.navigate(this.props.route);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View>
        <Link
          onPress={this.onPress}
          activeOpacity={1}
          alignItems={this.props.alignItems}
        >
          <View style={{ alignItems: 'center' }}>
            {this.props.renderIcon()}
            <LinkText>
              {this.props.text}
            </LinkText>
          </View>
        </Link>
      </View>
    );
  }
}

IconLink.defaultProps = {
  lastIcon: false,
};

IconLink.propTypes = {
  renderIcon: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  route: PropTypes.string.isRequired,
  navigation: PropTypes.shape(),
  alignItems: PropTypes.string.isRequired,
};

export default withNavigation(IconLink);
