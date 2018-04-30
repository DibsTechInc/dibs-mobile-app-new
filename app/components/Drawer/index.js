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

const getDrawerItem = navigation => (
  <DrawerItem
    iconName="bars"
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

const getDrawerIcon = (iconName, tintColor) => <Icon name={iconName} size={20} color={tintColor} />;

const homeDrawerIcon = ({ tintColor }) => getDrawerIcon('home', tintColor);
const userDrawerIcon = ({ tintColor }) => getDrawerIcon('user', tintColor);
const scheduleDrawerIcon = ({ tintColor }) => getDrawerIcon('calendar', tintColor);

export const homeNavOptions = getDrawerNavigationOptions(MAIN_ROUTE, Colors.PRIMARY, 'white', homeDrawerIcon);
export const userNavOptions = getDrawerNavigationOptions(PROFILE_ROUTE, Colors.PRIMARY, 'white', userDrawerIcon);
export const scheduleNavOptions = getDrawerNavigationOptions(SCHEDULE_ROUTE, Colors.PRIMARY, 'white', scheduleDrawerIcon);

const Drawer = DrawerNavigator({
  [MAIN_ROUTE]: { screen: MainPage, navigationOptions: homeNavOptions },
  [PROFILE_ROUTE]: { screen: ProfilePage, navigationOptions: userNavOptions },
  [SCHEDULE_ROUTE]: { screen: SchedulePage, navigationOptions: scheduleNavOptions },
}, getDrawerConfig(300, 'left', MAIN_ROUTE));

Drawer.navigationOptions = ({ navigation }) => getNavigationOptionsWithAction('', Colors.PRIMARY, 'white', getDrawerItem(navigation));

export default Drawer;
