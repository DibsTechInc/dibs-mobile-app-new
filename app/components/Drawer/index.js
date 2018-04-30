import React from 'react';
import { DrawerNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getNavigationOptionsWithAction, getDrawerNavigationOptions, getDrawerConfig } from '../../util/navigation';
import DrawerItem from './DrawerItem';
import MainPage from '../MainPage';
import ProfilePage from '../ProfilePage';
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

const homeNavOptions = getDrawerNavigationOptions('Main', Colors.PRIMARY, 'white', homeDrawerIcon);
const userNavOptions = getDrawerNavigationOptions('Profile', Colors.PRIMARY, 'white', userDrawerIcon);

const Drawer = DrawerNavigator({
  HomeScreen: { screen: MainPage, navigationOptions: homeNavOptions },
  UserScreen: { screen: ProfilePage, navigationOptions: userNavOptions },
}, getDrawerConfig(300, 'left', 'HomeScreen'));

Drawer.navigationOptions = ({ navigation }) => getNavigationOptionsWithAction('', Colors.PRIMARY, 'white', getDrawerItem(navigation));

export default Drawer;
