import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withNavigation, NavigationActions } from 'react-navigation';
import Icon from '../../shared/Icon';
import { DARK_TEXT_GREY } from '../../../constants';

const TouchableContainer = styled.TouchableOpacity`
  margin-bottom: -15;
  margin-left: -20;
`;

const RowView = styled.View`
  align-items: center;
  flex-direction: row;
  width: 100px;
`;

const IconContainer = styled.View`
  justify-content: flex-start;
  width: 60;
`;

const LinkText = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
  margin-left: 5;
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
    const navigateAction = NavigationActions.navigate({
      routeName: this.props.route,
    });

    if (this.props.loggingOut) {
      this.props.logOutUser(() => {
        this.props.navigation.dispatch(navigateAction);
      });
      return;
    }

    this.props.navigation.dispatch(navigateAction);
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
            <Icon
              iconName={this.props.iconName}
              size={20}
              color={DARK_TEXT_GREY}
            />
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
  iconName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  route: PropTypes.string.isRequired,
  navigation: PropTypes.shape().isRequired,
  loggingOut: PropTypes.bool,
  logOutUser: PropTypes.func,
};

export default withNavigation(NavLink);
