import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import Config from '../../../../config.json';
import {
  MAIN_ROUTE,
  PROFILE_ROUTE,
  SCHEDULE_ROUTE,
  WHITE,
  DARK_TEXT_GREY,
  UPCOMING_CLASS_ROUTE,
  BUY_ROUTE,
  REFER_A_FRIEND_ROUTE,
  MY_CLASSES_ROUTE,
} from '../../../constants';
import {
  getUsersFullName,
  getFormattedTotalCreditsWithFlashCredits,
  getUsersFirstPassName,
  getUserHasFlashCredit,
  getStudioShowsCredits,
  getUsersFirstPassIsUnlimited,
  getUsersFirstPassUsesLeft,
  getUsersFirstPassShortExpiresAt,
} from '../../../selectors';
import {
  CartIcon,
  XIcon,
  CalendarIcon,
  UserIcon,
  ActivityIcon,
  HomeIcon,
  PackageIcon,
  RafIcon,
  MyClassesIcon,
} from '../../shared';
import { SpaceBetweenRow, HeavyText } from '../../styled';
import BalanceDisplay from './BalanceDisplay';
import NavLink from './NavLink';

const StyledContainer = styled.View`
  background: ${WHITE};
  paddingHorizontal: 20;
  paddingTop: 20;
  height: 100%;
`;

const StyledHeader = styled(SpaceBetweenRow)`
  align-items: center;
`;

const StyledCloseButtonContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 20;
`;

const StyledHeavyText = styled(HeavyText)`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
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
          <XIcon
            onPress={this.close}
            size={18}
            stroke={Config.STUDIO_COLOR}
            strokeWidth={2.5}
          />
        </StyledCloseButtonContainer>
        <StyledHeader>
          <StyledHeavyText numberOfLines={1}>
            {this.props.userFullName}
          </StyledHeavyText>
          <CartIcon iconColor={DARK_TEXT_GREY} fromSideMenu />
        </StyledHeader>
        <BalanceDisplay
          label="Credit Balance"
          value={this.props.creditBalance}
          hasFlashCredit={this.props.hasFlashCredit}
        />
        {Boolean(this.props.firstPassName) ? (
          <BalanceDisplay
            label="Current Package"
            value={[
              (this.props.firstPassIsUnlimited ?
                '' : `${this.props.firstPassUsesLeft} Left - `)
              + this.props.firstPassName,
              `(Exp. ${this.props.firstPassExp})`,
            ]}
          />
        ) : undefined}
        <NavLink
          label="Main"
          route={MAIN_ROUTE}
          renderIcon={() => <HomeIcon />}
        />
        <NavLink
          label="Book"
          route={SCHEDULE_ROUTE}
          renderIcon={() => <ActivityIcon fromSideMenu />}
        />
        <NavLink
          label="Studio Schedule"
          route={UPCOMING_CLASS_ROUTE}
          renderIcon={() => <CalendarIcon fromSideMenu />}
        />
        <NavLink
          label="Account"
          route={PROFILE_ROUTE}
          renderIcon={() => <UserIcon fromSideMenu />}
        />
        <NavLink
          label={this.props.showsCreditTiers ? 'Credits & Packages' : 'Packages'}
          route={BUY_ROUTE}
          renderIcon={() => <PackageIcon fromSideMenu />}
        />
        <NavLink
          label={'My Classes'}
          route={MY_CLASSES_ROUTE}
          renderIcon={() => <MyClassesIcon fromSideMenu />}
        />
        <NavLink
          label="Refer a Friend"
          route={REFER_A_FRIEND_ROUTE}
          renderIcon={() => <RafIcon />}
        />
      </StyledContainer>
    );
  }
}

SideMenu.propTypes = {
  userFullName: PropTypes.string,
  creditBalance: PropTypes.string,
  hasFlashCredit: PropTypes.bool,
  firstPassName: PropTypes.string,
  firstPassIsUnlimited: PropTypes.bool,
  firstPassUsesLeft: PropTypes.number,
  firstPassExp: PropTypes.string,
  navigation: PropTypes.shape(),
  showsCreditTiers: PropTypes.bool,
};

const mapStateToProps = state => ({
  userFullName: getUsersFullName(state),
  creditBalance: getFormattedTotalCreditsWithFlashCredits(state),
  firstPassName: getUsersFirstPassName(state),
  firstPassIsUnlimited: getUsersFirstPassIsUnlimited(state),
  firstPassUsesLeft: getUsersFirstPassUsesLeft(state),
  firstPassExp: getUsersFirstPassShortExpiresAt(state),
  hasFlashCredit: getUserHasFlashCredit(state),
  showsCreditTiers: getStudioShowsCredits(state),
});

export default connect(mapStateToProps)(SideMenu);
