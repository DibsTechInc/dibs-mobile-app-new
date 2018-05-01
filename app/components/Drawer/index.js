import React from 'react';
import { DrawerNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  MAIN_ROUTE,
  PROFILE_ROUTE,
  SCHEDULE_ROUTE,
} from '../../constants/RouteConstants/index';
import {
  getNavigationOptionsWithAction,
  getDrawerConfig,
  getDrawerNavigationOptions,
} from '../../util/navigation';
import DrawerItem from './DrawerItem';
import MainPage from '../MainPage';
import ProfilePage from '../ProfilePage';
import SchedulePage from '../SchedulePage';
import * as Colors from '../../theme/colors';
import SideMenu from './SideMenu';

const getDrawerItem = navigation => (
  <DrawerItem
    iconName="bars"
    studioColor={Colors.PRIMARY}
    onPress={() => {
      if (navigation.state.index === 0) {
        // check if drawer is not open, then only open it
        navigation.navigate('DrawerOpen');
      } else {
        // else close the drawer
        navigation.navigate('DrawerClose');
      }
    }}
  />
);

const getDrawerIcon = iconName => <Icon name={iconName} size={20} color={Colors.PRIMARY} />;

const homeDrawerIcon = () => getDrawerIcon('home');
const userDrawerIcon = () => getDrawerIcon('user');
const scheduleDrawerIcon = () => getDrawerIcon('calendar');

export const homeNavOptions = getDrawerNavigationOptions(null, 'white', Colors.PRIMARY, homeDrawerIcon);
export const userNavOptions = getDrawerNavigationOptions(null, '#fff', Colors.PRIMARY, userDrawerIcon);
export const scheduleNavOptions = getDrawerNavigationOptions(null, Colors.PRIMARY, Colors.PRIMARY, scheduleDrawerIcon);

const Drawer = DrawerNavigator({
  [MAIN_ROUTE]: { screen: MainPage, navigationOptions: homeNavOptions },
  [PROFILE_ROUTE]: { screen: ProfilePage, navigationOptions: userNavOptions },
  [SCHEDULE_ROUTE]: { screen: SchedulePage, navigationOptions: scheduleNavOptions },
}, getDrawerConfig(300, 'left', MAIN_ROUTE, SideMenu));

Drawer.navigationOptions = ({ navigation }) => {
  const opts = getNavigationOptionsWithAction(null, 'white', 'white', getDrawerItem(navigation));

  return opts;
};

export default Drawer;
