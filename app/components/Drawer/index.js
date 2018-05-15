import { DrawerNavigator } from 'react-navigation';
import {
  MAIN_ROUTE,
  PROFILE_ROUTE,
  SCHEDULE_ROUTE,
  CART_ROUTE,
  CONFIRMATION_ROUTE,
  RECEIPT_ROUTE,
} from '../../constants/RouteConstants/index';
import {
  getDrawerConfig,
} from '../../util/navigation';
import MainPage from '../MainPage';
import { ProfilePage } from '../ProfilePage';
import SchedulePage from '../SchedulePage';
import CartPage from '../CartPage';
import SideMenu from './SideMenu';
import ConfirmationPage from '../ConfirmationPage';
import ReceiptPage from '../ReceiptPage';

const Drawer = DrawerNavigator({
  [MAIN_ROUTE]: { screen: MainPage },
  [PROFILE_ROUTE]: { screen: ProfilePage },
  [SCHEDULE_ROUTE]: { screen: SchedulePage },
  [CART_ROUTE]: { screen: CartPage },
  [CONFIRMATION_ROUTE]: { screen: ConfirmationPage },
  [RECEIPT_ROUTE]: { screen: ReceiptPage },
}, getDrawerConfig(300, 'left', MAIN_ROUTE, SideMenu));

export default Drawer;
