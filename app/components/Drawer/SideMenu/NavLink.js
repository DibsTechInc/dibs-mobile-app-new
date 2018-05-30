import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withNavigation } from 'react-navigation';
import Icon from '../../shared/Icon';
import { DARK_TEXT_GREY } from '../../../constants';
import { NormalText } from '../../styled';

const TouchableContainer = styled.TouchableOpacity`
  margin-bottom: -15;
  margin-left: -20;
  width: 150;
`;

const RowView = styled.View`
  align-items: center;
  flex-direction: row;
  width: 150;
`;

const IconContainer = styled.View`
  justify-content: flex-start;
  width: 60;
`;

const LinkText = NormalText.extend`
  color: ${DARK_TEXT_GREY};
`;

/**
 * @class NavLink
 * @extends {React.PureComponent}
 */
class NavLink extends React.PureComponent {
  /**
   * @constructor
   * @constructs NavLink
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.openRoute = this.openRoute.bind(this);
  }
  /**
   * @returns {undefined}
   */
  openRoute() {
    this.props.navigation.navigate(this.props.route);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <TouchableContainer onPress={this.openRoute}>
        <RowView>
          <IconContainer>
            {this.props.renderIcon()}
          </IconContainer>
          <LinkText>
            {this.props.label}
          </LinkText>
        </RowView>
      </TouchableContainer>
    );
  }
}

NavLink.propTypes = {
  label: PropTypes.string.isRequired,
  route: PropTypes.string.isRequired,
  navigation: PropTypes.shape().isRequired,
  renderIcon: PropTypes.func.isRequired,
};

export default withNavigation(NavLink);
