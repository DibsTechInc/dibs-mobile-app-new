import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { connect } from 'react-redux';

import Config from '../../../config.json';
import { WHITE } from '../../constants';
import { requestEventData } from '../../actions';
import {
  getEventsAreLoading,
} from '../../selectors';
import Header from '../Header';
import FadeInView from '../shared/FadeInView';
import CalendarStrip from './CalendarStrip';
import EventList from './EventList';

/**
 * @class SchedulePage
 * @extends Component
 */
class SchedulePage extends PureComponent {
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
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ height: '100%', backgroundColor: Config.STUDIO_COLOR }}>
        <Header />
        <CalendarStrip />
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

