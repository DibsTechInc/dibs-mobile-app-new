import { StackNavigator } from 'react-navigation';

import { SchedulePage } from '../components/SchedulePage';
import AuthPage from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';

const Router = StackNavigator(
  {
    Landing: {
      screen: LandingPage,
    },
    Login: {
      screen: AuthPage,
    },
    Main: {
      screen: MainPage,
    },
    Schedule: {
      screen: SchedulePage,
    },
    Profile: {
      screen: ProfilePage,
    },
  },
  {
    initialRouteName: 'Landing',
  },
);

export default Router;
