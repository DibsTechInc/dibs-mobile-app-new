import { DrawerNavigator } from 'react-navigation';

import {
  MAIN_ROUTE,
  PROFILE_ROUTE,
  SCHEDULE_ROUTE,
  CART_ROUTE,
  RECEIPT_ROUTE,
  UPCOMING_CLASS_ROUTE,
  BUY_ROUTE,
  REFER_A_FRIEND_ROUTE,
} from '../../constants';

import {
  getDrawerConfig,
} from '../../util/navigation';

import MainPage from '../MainPage';
import { ProfilePage } from '../ProfilePage';
import SchedulePage from '../SchedulePage';
import CartPage from '../CartPage';
import SideMenu from './SideMenu';
import ReceiptPage from '../ReceiptPage';
import UpcomingClassesPage from '../UpcomingClassesPage';
import BuyItemsPage from '../BuyItemsPage';
import ReferAFriendPage from '../ReferAFriendPage';

export default DrawerNavigator({
  [MAIN_ROUTE]: { screen: MainPage },
  [PROFILE_ROUTE]: { screen: ProfilePage },
  [SCHEDULE_ROUTE]: { screen: SchedulePage },
  [UPCOMING_CLASS_ROUTE]: { screen: UpcomingClassesPage },
  [CART_ROUTE]: { screen: CartPage },
  [RECEIPT_ROUTE]: { screen: ReceiptPage },
  [BUY_ROUTE]: { screen: BuyItemsPage },
  [REFER_A_FRIEND_ROUTE]: { screen: ReferAFriendPage },
}, getDrawerConfig(300, 'left', MAIN_ROUTE, SideMenu));
