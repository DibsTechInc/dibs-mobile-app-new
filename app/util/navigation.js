export const getNavigationOptions = (title, backgroundColor, color) => ({
  title,
  headerTitle: title,
  headerStyle: {
    backgroundColor,
  },
  headerTitleStyle: {
    color,
  },
  headerTintColor: color,
});

export const getNavigationOptionsWithAction = (title, backgroundColor, color, headerLeft) => ({
  title,
  headerStyle: {
    backgroundColor,
    elevation: 0,
    borderBottomWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    color,
  },
  headerTintColor: color,
  activeTintColor: 'black',
  headerLeft,
});

export const getDrawerNavigationOptions = (title, backgroundColor, titleColor, drawerIcon) => ({
  title,
  headerTitle: title,
  headerStyle: {
    backgroundColor,
    elevation: 0,
    borderBottomWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    color: titleColor,
  },
  activeTintColor: 'black',
  headerTintColor: titleColor,
  drawerLabel: title,
  drawerIcon,
});

export const getDrawerConfig = (drawerWidth, drawerPosition, initialRouteName, contentComponent) => ({
  drawerWidth,
  drawerPosition,
  initialRouteName,
  drawerOpenRoute: 'DrawerOpen',
  drawerCloseRoute: 'DrawerClose',
  drawerToggleRoute: 'DrawerToggle',
  contentOptions: {
    activeTintColor: 'black',
    inactiveTintColor: 'black',
    labelStyle: {
      fontFamily: 'studio-font',
    },
  },
  contentComponent,
});
