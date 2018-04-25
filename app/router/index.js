import { StackNavigator } from 'react-navigation';

import { SchedulePage } from '../components/SchedulePage';
import { EnterPassword, Signup } from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';

const Router = StackNavigator(
  {
    Landing: {
      screen: LandingPage,
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
    Login: {
      screen: EnterPassword,
    },
    Register: {
      screen: Signup,
    }
  },
  {
    initialRouteName: 'Landing',
  },
);

export default Router;
