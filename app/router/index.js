import { StackNavigator } from 'react-navigation';

import { SchedulePage } from '../components/SchedulePage';
import { EnterPassword, EnterEmail, Signup } from '../components/AuthPage';
import LandingPage from '../components/LandingPage';
import MainPage from '../components/MainPage';
import ProfilePage from '../components/ProfilePage';

const AppStack = StackNavigator(
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
    Verify: {
      screen: EnterEmail,
    },
    Login: {
      screen: EnterPassword,
    },
    Register: {
      screen: Signup,
    }
  },
  {
    headerMode: 'none',
    initialRouteName: 'Landing',
    navigationOptions: {
      gesturesEnabled: true,
    },
  },
);

export default AppStack;
