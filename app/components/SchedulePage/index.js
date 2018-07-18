import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View, Animated } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modalbox';

import Config from '../../../config.json';
import { WHITE, HEIGHT } from '../../constants';

import {
  requestEventData,
  setCurrentSpotBookingEventId,
  setCartEventsData,
} from '../../actions';

import {
  getEventsAreLoading,
  getEventsCurrentSpotBookingEventId,
} from '../../selectors';

import Header from '../Header';
import { FadeInView } from '../shared/';
import SpotBookingPage from '../SpotBookingPage';

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
    this.closePickingSpotsModal = this.closePickingSpotsModal.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.setCurrentSpotBookingEventId(null);
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
   * @return {undefined}
   */
  closePickingSpotsModal() {
    this.props.setCurrentSpotBookingEventId(null);
    this.props.setCartEventsData([]);
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
        <Modal
          isOpen={Boolean(this.props.currentSpotBookingEventId)}
          onClosed={this.closePickingSpotsModal}
          style={{ height: HEIGHT, justifyContent: 'space-around', alignItems: 'center' }}
          swipeToClose={false}
        >
          <SpotBookingPage
            spotBookingOpened={Boolean(this.props.currentSpotBookingEventId)}
            closePickingSpotsModal={this.closePickingSpotsModal}
          />
        </Modal>
      </FadeInView>
    );
  }
}

SchedulePage.propTypes = {
  requestEventData: PropTypes.func,
  currentDate: PropTypes.shape(),
  currentSpotBookingEventId: PropTypes.number,
  setCurrentSpotBookingEventId: PropTypes.func,
  setCartEventsData: PropTypes.func,
};

const mapStateToProps = state => ({
  isLoading: getEventsAreLoading(state),
  currentDate: state.events.currentDate,
  currentSpotBookingEventId: getEventsCurrentSpotBookingEventId(state),
});

const mapDispatchToProps = {
  requestEventData,
  setCurrentSpotBookingEventId,
  setCartEventsData,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

