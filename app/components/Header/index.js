import React from 'react';
import PropTypes from 'prop-types';
import { withNavigation } from 'react-navigation';
import { View, TouchableOpacity, AsyncStorage } from 'react-native';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { isIphoneX } from 'react-native-iphone-x-helper';
import styled from 'styled-components';

import Config from '../../../config.json';
import { WHITE, FILTERS_SETTINGS, SCHEDULE_ROUTE } from '../../constants';
import {
  getFiltersState,
  getStudioHasMultipleLocations,
  getStudioHasSpotBooking,
  getCartEvents,
} from '../../selectors';
import {
  setUpcomingEventSliderExpandedFalse,
  setAllFilters,
  clearAllFilters,
  setCartEventsData,
} from '../../actions';
import { FlexRow, HeavyText, NormalText } from '../styled';
import { BackArrow, CustomStatusBar, CartIcon, XIcon, FiltersIcon, CheckIcon } from '../shared';

const StudioColoredTop = styled(FlexRow)`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  height: ${60 + (isIphoneX() ? 30 : 0)};
  justify-content: space-between;
`;

const FilterView = styled.View`
  width: 90px;
  height: 25px;
  margin: 20px;
  border-width: 1;
  border-color: ${WHITE};
  border-radius: 10;
  padding-right: 15px;
  justify-content: space-around;
  flex-direction: row;
  align-items: center;
`;

const PageTitle = styled(HeavyText)`
  color: ${WHITE};
  font-size: 16;
  text-align: center;
`;

/**
 * @class Header
 * @extends {React.PureComponent}
 */
class Header extends React.PureComponent {
  /**
   * @constructor
   * @constructs NoItems
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.goBack = this.goBack.bind(this);
    this.handleOnCloseSaveFilter = this.handleOnCloseSaveFilter.bind(this);
    this.handleOnCloseExitFilter = this.handleOnCloseExitFilter.bind(this);
    this.handleSavedFilters = this.handleSavedFilters.bind(this);
    this.getXIconOnPressFunction = this.getXIconOnPressFunction.bind(this);
    this.getHeaderRightIcon = this.getHeaderRightIcon.bind(this);
  }
  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    this.handleSavedFilters();
  }
  /**
   * @returns {undefined}
   */
  getXIconOnPressFunction() {
    switch (true) {
      case this.props.filterSlideOpened:
        return this.handleOnCloseExitFilter();
      case this.props.spotBookingOpened:
        return this.props.closePickingSpotsModal();
      default:
        return this.props.setUpcomingEventSliderExpandedFalse();

    }
  }
  /**
 * @returns {undefined}
 */
  async handleOnCloseSaveFilter() {
    this.props.hideFilter();
    await AsyncStorage.setItem(FILTERS_SETTINGS, JSON.stringify(this.props.filters));
  }
  /**
 * @returns {undefined}
 */
  async handleOnCloseExitFilter() {
    this.props.hideFilter();
    const savedFilters = this.handleSavedFilters();
    if (!savedFilters) {
      this.props.clearAllFilters();
    }
  }
  /**
   * @returns {undefined}
   */
  goBack() {
    if (this.props.studioHasSpotBooking && this.props.cart.length) {
      this.props.setCartEventsData([]);
      return this.props.navigation.navigate(SCHEDULE_ROUTE);
    }

    if (
      this.props.navigation.state.params
      && this.props.navigation.state.params.previousRoute
    ) return this.props.navigation.navigate(this.props.navigation.state.params.previousRoute);
    return this.props.navigation.goBack();
  }
  /**
   * @returns {object} filterSettings the saved filters settings
   */
  async handleSavedFilters() {
    let filterSettings = await AsyncStorage.getItem(FILTERS_SETTINGS);
    if (filterSettings && filterSettings.length) {
      filterSettings = JSON.parse(filterSettings);
      this.props.setAllFilters(filterSettings);
    }

    return filterSettings;
  }
  /**
   * @returns {undefined}
   */
  getHeaderRightIcon() {
    switch (true) {
      case this.props.filterSlideOpened:
        return <CheckIcon handleOnPress={this.handleOnCloseSaveFilter} />;
      case this.props.showCart:
        return <CartIcon iconColor={WHITE} />;
      default:
        return null;
    }
  }
  /**
   * @returns {JSX.Element} XML
   */
  render() {
    const renderXIcon = this.props.upcomingEventSliderExpanded || this.props.isSliderHeader || this.props.filterSlideOpened || this.props.spotBookingOpened;

    const leftButton = (renderXIcon) ? (
      <View style={{ width: 30, marginLeft: 15 }}>
        <XIcon
          onPress={this.getXIconOnPressFunction}
          stroke={WHITE}
          strokeWidth={2.5}
          size={18}
        />
      </View>
    ) : (
        <BackArrow
          onPress={this.goBack}
          style={{ marginLeft: 15 }}
          stroke={WHITE}
          strokeWidth={2.5}
        />
      );

    const showFilter = this.props.studioHasMultipleLocations && this.props.hasClassFilter && !this.props.filterSlideOpened;
    return (
      <View style={{ height: 80 + (isIphoneX() ? 20 : 0), overflow: 'hidden', zIndex: 2, ...this.props.headerStyle }}>
        <CustomStatusBar backgroundColor={Config.STUDIO_COLOR} barStyle="light-content" />
        <StudioColoredTop>
          <View style={{ width: 60 }}>
            {leftButton}
          </View>
          <PageTitle>
            {this.props.title}
          </PageTitle>

          <View style={{ flexDirection: 'row' }}>
            {!!showFilter && <TouchableOpacity onPress={this.props.showFilter} style={{ width: 90, marginRight: 20 }}>
              <FilterView>
                <FiltersIcon />
                <NormalText style={{ color: WHITE, marginLeft: 5, marginRight: 1 }}>Filters</NormalText>
              </FilterView>
            </TouchableOpacity>}
            <View style={{ width: 60 }}>
              {this.getHeaderRightIcon()}
            </View>
          </View>
        </StudioColoredTop>
      </View>
    );
  }
}

Header.defaultProps = {
  title: '',
  isSliderHeader: false,
  hasClassFilter: false,
  hasClassHistory: false,
  showCart: true,
};

Header.propTypes = {
  navigation: PropTypes.shape().isRequired,
  title: PropTypes.string,
  upcomingEventSliderExpanded: PropTypes.bool.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
  isSliderHeader: PropTypes.bool,
  hasClassFilter: PropTypes.bool,
  showFilter: PropTypes.func,
  hideFilter: PropTypes.func,
  filterSlideOpened: PropTypes.bool,
  filters: PropTypes.shape(),
  setAllFilters: PropTypes.func,
  clearAllFilters: PropTypes.func,
  studioHasMultipleLocations: PropTypes.bool,
  headerStyle: PropTypes.shape(),
  closePickingSpotsModal: PropTypes.func,
  spotBookingOpened: PropTypes.bool,
  showCart: PropTypes.bool,
  studioHasSpotBooking: PropTypes.bool,
  cart: PropTypes.arrayOf(PropTypes.shape()),
  setCartEventsData: PropTypes.func,
  hasClassHistory: PropTypes.bool,
};

const mapStateToProps = state => ({
  upcomingEventSliderExpanded: state.animation.upcomingEventSliderExpanded,
  filters: getFiltersState(state),
  studioHasMultipleLocations: getStudioHasMultipleLocations(state),
  studioHasSpotBooking: getStudioHasSpotBooking(state),
  cart: getCartEvents(state),
});

const mapDispatchToProps = {
  setUpcomingEventSliderExpandedFalse,
  setAllFilters,
  clearAllFilters,
  setCartEventsData,
};

export default compose(
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps)
)(Header);
