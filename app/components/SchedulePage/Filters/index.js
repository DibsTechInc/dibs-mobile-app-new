import React from 'react';
import { connect } from 'react-redux';
import { View, ScrollView, Animated } from 'react-native';
import PropTypes from 'prop-types';

import { HeavyText } from '../../styled';
import { FadeInView } from '../../shared';
import { WHITE, WIDTH, HEIGHT } from '../../../constants';
import Config from '../../../../config.json';
import FilterButton from './FilterButton';
import {
  getStudioLocationFilterOptions,
  getFilterLocationIds,
} from '../../../selectors';
import { setFilter, setSelectedLocationId } from '../../../actions';

/**
 * @class Filters
 * @extends {React.PureComponent}
 */
class Filters extends React.PureComponent {
  /**
   * @constructor
   * @constructs Filters
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.handleLocationChange = this.handleLocationChange.bind(this);
  }
  /**
   * Location filter change event handler
   * @param {Object} option selected for location filter
   * @returns {undefined}
   */
  handleLocationChange(option) {
    if (option && option.value !== 0) { // 0 is all locations default
      return this.props.setFilter({ locationids: option.value });
    }
    return this.props.setFilter({ locationids: '' });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const locationFilters = this.props.locationOptions.map(location =>
      (<FilterButton
        location={location}
        key={location.label}
        name={location.label}
        selectFilter={this.props.selectFilter}
        handleLocationChange={this.handleLocationChange}
        selectedLocationId={this.props.selectedLocationId}
      />));

    return (
      <View style={{ position: 'relative', backgroundColor: 'transparent', zIndex: (this.props.filterSlideOpened || this.props.displaySlideDownContents) ? 1 : 0 }}>
        <Animated.View style={{
          backgroundColor: Config.STUDIO_COLOR,
          position: 'absolute',
          top: this.props.slideAnimation,
          left: 0,
          right: 0,
          height: HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
        >
          <FadeInView style={{ width: WIDTH, marginLeft: 25, marginBottom: 25, marginTop: 35 }}>
            {this.props.displaySlideDownContents &&
              <FadeInView>
                <ScrollView contentContainerStyle={{ height: HEIGHT }}>
                  <HeavyText style={{ color: WHITE, marginBottom: 15 }}>Location</HeavyText>
                  <FilterButton
                    location={{ value: 0 }}
                    name="All Locations"
                    isDefaultFilter={!this.props.selectedLocationId.length}
                    selectFilter={this.props.selectFilter}
                    handleLocationChange={this.handleLocationChange}
                  />
                  {locationFilters}
                </ScrollView>
              </FadeInView>}
          </FadeInView>
        </Animated.View>
      </View>
    );
  }
}

Filters.propTypes = {
  selectFilter: PropTypes.func,
  filterSlideOpened: PropTypes.bool.isRequired,
  displaySlideDownContents: PropTypes.bool.isRequired,
  slideAnimation: PropTypes.shape().isRequired,
  locationOptions: PropTypes.arrayOf(PropTypes.shape()),
  selectedLocations: PropTypes.string,
  setFilter: PropTypes.func,
  setSelectedLocationId: PropTypes.func,
  selectedLocationId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const mapStateToProps = state => ({
  locationOptions: getStudioLocationFilterOptions(state),
  selectedLocationId: getFilterLocationIds(state),
});

const mapDispatchToProps = {
  setFilter,
  setSelectedLocationId,
};

export default connect(mapStateToProps, mapDispatchToProps)(Filters);
