import { StackNavigator } from 'react-navigation';

import { SchedulePage } from '../components/SchedulePage';
import AuthPage from '../components/AuthPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';

const Router = StackNavigator(
  {
    Home: {
      screen: MainPage,
    },
    Login: {
      screen: AuthPage,
    },
    Profile: {
      screen: ProfilePage,
    },
  },
  {
    initialRouteName: 'Home',
  },
);

export default Router;
