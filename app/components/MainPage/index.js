import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { Svg, Path } from 'react-native-svg';
import { Updates } from 'expo';
import { isIphoneX } from 'react-native-iphone-x-helper';

import backgroundImg from '../../../assets/img/main-page.png';
import {
  BLACK,
  WHITE,
  LIGHT_GREY,
  SCHEDULE_ROUTE,
  PROFILE_ROUTE,
  UPCOMING_CLASS_ROUTE,
  HEIGHT,
  DRAWER_OPEN,
} from '../../constants';
import {
  getUserFirstName,
  getStudioName,
  getUserHasUpcomingEvents,
} from '../../selectors';
import {
  FadeInView,
  CustomStatusBar,
  BurgerIcon,
  CartIcon,
  CalendarIcon,
  UserIcon,
  ActivityIcon,
} from '../shared';
import { HeavyText, FlexRow, SpaceBetweenRow } from '../styled';
import IconLink from './IconLink';
import UpcomingEventSlider from './UpcomingEventSlider';

const BackgroundImage = styled.Image`
  left: 0;
  height: ${HEIGHT};
  opacity: 0.25;
  position: absolute;
  right: 0;
  top: 0;
`;

const MainPageHeader = SpaceBetweenRow.extend`
  align-items: center;
  margin-top: ${isIphoneX() * 15};
`;

const Content = styled.View`
  flex: 1;
  justify-content: ${props => (props.hasUpcomingClasses ? 'center' : 'flex-end')};
  margin-bottom: ${props => (props.hasUpcomingClasses ? 190 : (HEIGHT / 10))};
  padding-horizontal: 40;
`;

const Greeting = HeavyText.extend`
  color: ${WHITE};
  font-size: 32;
`;

const Welcome = styled.Text`
  color: ${LIGHT_GREY};
  font-size: 14;
  font-family: 'flex-font';
`;

const IconRow = FlexRow.extend`
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 15;
  position: relative;
  width: 100%;
`;

const IconBorder = () => (
  <Svg width={2} height={50}>
    <Path
      strokeWidth={1}
      stroke={WHITE}
      d="M 1 0 L 1 50"
    />
  </Svg>
);

/**
 * @class MainPage
 * @extends {React.PureComponent}
 */
class MainPage extends React.PureComponent {
  /**
   * @constructor
   * @constructs MainPage
   */
  constructor() {
    super();
    this.navigateToDrawer = this.navigateToDrawer.bind(this);
  }
  /**
   * @returns {undefined}
   */
  async componentWillMount() {
    await this.getUpdates();
  }

  /**
   * @returns {undefined}
   */
  async getUpdates() {
    if (__DEV__) {
      return;
    }

    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Updates.reloadFromCache();
    }
  }

  /**
   * @returns {undefined}
   */
  navigateToDrawer() {
    const navigateAction = NavigationActions.navigate({
      routeName: DRAWER_OPEN,
    });

    const keyType = this.props.navigation.state.key.split('-')[0];
    const pop = NavigationActions.pop();

    if (keyType === 'id') {
      this.props.navigation.dispatch(pop);
    } else {
      this.props.navigation.dispatch(navigateAction);
    }
  }
  /**
   * render
   * @returns {JSX.Element} XML
   */
  render() {
    return (
      <FadeInView style={{ position: 'relative', backgroundColor: BLACK }}>
        <CustomStatusBar backgroundColor={'transparent'} barStyle="light-content" />
        <BackgroundImage source={backgroundImg} />
        <MainPageHeader>
          <BurgerIcon onPress={this.navigateToDrawer} style={{ marginLeft: 20 }} />
          <CartIcon iconColor={WHITE} />
        </MainPageHeader>
        <Content hasUpcomingClasses={this.props.hasUpcomingClasses}>
          <Greeting numberOfLines={1}>
            Hi {this.props.userFirstName}!
          </Greeting>
          <Welcome>
            Welcome to {this.props.studioName}
          </Welcome>
          <IconRow>
            <IconLink
              text="BOOK"
              route={SCHEDULE_ROUTE}
              alignItems="flex-start"
              renderIcon={() => <CalendarIcon />}
            />
            <IconBorder />
            <IconLink
              text={'UPCOMING'}
              route={UPCOMING_CLASS_ROUTE}
              alignItems="center"
              renderIcon={() => <ActivityIcon />}
            />
            <IconBorder />
            <IconLink
              text="ACCOUNT"
              route={PROFILE_ROUTE}
              alignItems="flex-end"
              renderIcon={() => <UserIcon />}
            />
          </IconRow>
        </Content>
        {this.props.hasUpcomingClasses ? <UpcomingEventSlider /> : null}
      </FadeInView>
    );
  }
}

MainPage.propTypes = {
  userFirstName: PropTypes.string.isRequired,
  studioName: PropTypes.string.isRequired,
  hasUpcomingClasses: PropTypes.bool.isRequired,
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  studioName: getStudioName(state),
  hasUpcomingClasses: getUserHasUpcomingEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
