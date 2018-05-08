import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Config from '../../../config.json';
import { requestEventData, requestStudioData } from '../../actions';
import {
  setCurrentDate,
  getStudioDibsConfig,
  getEventsAreLoading,
} from '../../selectors';
import Header from '../Header';
import { WHITE } from '../../constants';
import FadeInView from '../shared/FadeInView';
import CalendarStrip from './CalendarStrip';
import EventList from './EventList';

/**
 * @class SchedulePage
 * @extends Component
 */
class SchedulePage extends Component {
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
        <Header
          navigation={this.props.navigation}
          iconColor={WHITE}
          backgroundColor={Config.STUDIO_COLOR}
        />
        <CalendarStrip
          // calendarAnimation={{ type: 'sequence', duration: 30 }}
          // selectionAnimation={{ duration: 300, borderWidth: 1 }}
          selection="background" // type of selection circle
          style={{ paddingBottom: 10 }}
          calendarColor={Config.STUDIO_COLOR} // main background color
          highlightColor="#f4f4f4" // color of the selection circle
          iconContainer={{ flex: 0.1 }}
          dateNumberStyle={{ color: WHITE }}
          dateNameStyle={{ color: WHITE }}
          calendarHeaderStyle={{ color: WHITE }}
          borderHighlightColor="white"
          highlightDateNameStyle={{ color: Config.STUDIO_COLOR }}
          highlightDateNumberStyle={{ color: Config.STUDIO_COLOR }}
        />
        <EventList />
      </FadeInView>
    );
  }
}

SchedulePage.propTypes = {
  requestEventData: PropTypes.func,
  isLoading: PropTypes.bool,
  currentDate: PropTypes.shape(),
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
  isLoading: getEventsAreLoading(state),
  studioConfig: getStudioDibsConfig(state),
  currentDate: state.currentDate,
});

const mapDispatchToProps = {
  requestEventData,
  requestStudioData,
  setCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

