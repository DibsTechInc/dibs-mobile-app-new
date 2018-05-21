import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import {
  MAIN_ROUTE,
  PROFILE_ROUTE,
  SCHEDULE_ROUTE,
  WHITE,
  DARK_TEXT_GREY,
  LANDING_ROUTE,
  UPCOMING_CLASS_ROUTE,
} from '../../../constants';
import {
  getUsersFullName,
  getFormattedTotalCreditsWithFlashCredits,
  getUsersFirstPassName,
  getUserHasFlashCredit,
} from '../../../selectors';
import { logOutUser } from '../../../actions';
import CartIcon from '../../shared/CartIcon';
import { SpaceBetweenRow } from '../../styled';
import BalanceDisplay from './BalanceDisplay';
import NavLink from './NavLink';
import Config from '../../../../config.json';

const StyledContainer = styled.View`
  background: ${WHITE};
  paddingHorizontal: 20;
  paddingTop: 20;
`;

const StyledHeader = SpaceBetweenRow.extend`
  align-items: center;
`;

const StyledCloseButtonContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 20;
`;

const StyledHeavyText = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-size: 20;
  font-family: 'flex-font-heavy';
  max-width: 180px;
`;

/**
 * @class SideMenu
 * @extends {React.PureComponent}
 */
class SideMenu extends React.PureComponent {
  /**
   * @constructor
   * @constructs SideMenu
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
  }
  /**
   * @returns {undefined}
   */
  close() {
    this.props.navigation.navigate('DrawerClose');
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <StyledContainer>
        <StyledCloseButtonContainer style={{ justifyContent: 'flex-start' }}>
          <TouchableOpacity onPress={this.close}>
            <Svg height={30} width={30}>
              <Path
                stroke={Config.STUDIO_COLOR}
                strokeWidth={3}
                d="M 12 5 L 2 15 L 12 25"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                stroke={Config.STUDIO_COLOR}
                strokeWidth={3}
                d="M 3 15 L 28 15"
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </StyledCloseButtonContainer>
        <StyledHeader>
          <StyledHeavyText numberOfLines={1}>
            {this.props.userFullName}
          </StyledHeavyText>
          <CartIcon iconColor={DARK_TEXT_GREY} />
        </StyledHeader>
        <BalanceDisplay
          label="Credit Balance"
          value={this.props.creditBalance}
          hasFlashCredit={this.props.hasFlashCredit}
        />
        {Boolean(this.props.nextPassName) && (
          <BalanceDisplay
            label="Current Package"
            value={this.props.nextPassName}
          />
        )}
        <NavLink
          iconName="home"
          label="Main"
          route={MAIN_ROUTE}
        />
        <NavLink
          iconName="user"
          label="Account"
          route={PROFILE_ROUTE}
        />
        <NavLink
          iconName="calendar"
          label="Schedule"
          route={SCHEDULE_ROUTE}
        />
        <NavLink
          iconName="arrow-up"
          label="Upcoming Classes"
          route={UPCOMING_CLASS_ROUTE}
        />
        <NavLink
          iconName="times"
          label="Log out"
          route={LANDING_ROUTE}
          loggingOut
          logOutUser={this.props.logOutUser}
        />
      </StyledContainer>
    );
  }
}

SideMenu.propTypes = {
  userFullName: PropTypes.string,
  creditBalance: PropTypes.string,
  hasFlashCredit: PropTypes.bool,
  nextPassName: PropTypes.string,
  navigation: PropTypes.shape(),
  logOutUser: PropTypes.func,
};

const mapStateToProps = state => ({
  userFullName: getUsersFullName(state),
  creditBalance: getFormattedTotalCreditsWithFlashCredits(state),
  nextPassName: getUsersFirstPassName(state),
  hasFlashCredit: getUserHasFlashCredit(state),
});
const mapDispatchToProps = {
  logOutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(SideMenu);
