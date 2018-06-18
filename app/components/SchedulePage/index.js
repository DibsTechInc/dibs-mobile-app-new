import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View, Animated } from 'react-native';
import { connect } from 'react-redux';

import Config from '../../../config.json';
import { WHITE, HEIGHT } from '../../constants';
import { requestEventData } from '../../actions';
import {
  getEventsAreLoading,
} from '../../selectors';
import Header from '../Header';
import { FadeInView } from '../shared/';
import CalendarStrip from './CalendarStrip';
import EventList from './EventList';
import Filters from './Filters';

/**
 * @class SchedulePage
 * @extends Component
 */
class SchedulePage extends PureComponent {
  /**
   * @constructor
   * @constructs SchedulePage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.state = {
      slideAnimation: new Animated.Value(-HEIGHT + 70),
      filterSlideOpened: false,
      displaySlideDownContents: false,
    };

    this.showFilter = this.showFilter.bind(this);
    this.hideFilter = this.hideFilter.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.requestEventData();
  }
  /**
   * @param {object} props react props
   * @returns {undefined}
   */
  componentDidUpdate(props) {
    if (props.currentDate.toISOString() !== this.props.currentDate.toISOString()) {
      this.props.requestEventData();
    }
  }
    /**
   * @return {undefined}
   */
  showFilter() {
    this.setState({ filterSlideOpened: true });
    Animated.timing(
      this.state.slideAnimation,
      { toValue: 0, duration: 300 }
    ).start(() => {
      this.setState({ displaySlideDownContents: true });
    });
  }
  /**
   * @return {undefined}
   */
  hideFilter() {
    this.setState({ displaySlideDownContents: false });
    Animated.timing(
      this.state.slideAnimation,
      { toValue: -HEIGHT + 70, duration: 300 }
    ).start(() => {
      this.setState({ filterSlideOpened: false });
    });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ height: HEIGHT, position: 'relative', backgroundColor: Config.STUDIO_COLOR }}>
        <Header
          hasClassFilter
          title={this.state.filterSlideOpened ? 'Filters' : ''}
          showFilter={this.showFilter}
          hideFilter={this.hideFilter}
          filterSlideOpened={this.state.filterSlideOpened}
        />
        <Filters
          filterSlideOpened={this.state.filterSlideOpened}
          displaySlideDownContents={this.state.displaySlideDownContents}
          slideAnimation={this.state.slideAnimation}
        />
        <CalendarStrip hideStrip={this.state.filterSlideOpened} />
        <View style={{ height: 1, backgroundColor: WHITE }} />
        <EventList />
      </FadeInView>
    );
  }
}

SchedulePage.propTypes = {
  requestEventData: PropTypes.func,
  currentDate: PropTypes.shape(),
};

const mapStateToProps = state => ({
  isLoading: getEventsAreLoading(state),
  currentDate: state.events.currentDate,
});

const mapDispatchToProps = {
  requestEventData,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

