import { StackNavigator } from 'react-navigation';

import { SchedulePage } from '../components/SchedulePage';
import AuthPage from '../components/AuthPage';
import MainPage from '../components/MainPage';

const Router = StackNavigator(
  {
    Home: {
      screen: MainPage,
    },
    Login: {
      screen: AuthPage,
    },
  },
  {
    initialRouteName: 'Home',
  },
);

export default Router;
