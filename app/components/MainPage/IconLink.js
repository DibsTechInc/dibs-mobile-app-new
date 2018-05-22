import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withNavigation } from 'react-navigation';
import { View } from 'react-native';

import { WHITE } from '../../constants';
import { NormalText } from '../styled';
import { Icon } from '../shared';

const Link = styled.TouchableOpacity`
  align-items: ${props => props.alignItems};
  justify-content: space-between;
`;

const LinkText = NormalText.extend`
  text-align: center;
  color: ${WHITE};
  font-size: 10;
  margin-top: 5;
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
            <Icon
              padding={0}
              iconName={this.props.iconName}
              style={{ color: WHITE }}
              onPress={this.onPress}
            />
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
  lastIcon: PropTypes.bool,
  iconName: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  route: PropTypes.string.isRequired,
  navigation: PropTypes.shape(),
  alignItems: PropTypes.string.isRequired,
};

export default withNavigation(IconLink);
