import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SwipeListView } from 'react-native-swipe-list-view';
import { ListView } from 'react-native';
import EventListItem from './EventListItem';
import { getScheduleEvents } from '../../selectors';

/**
 * @class SchedulePageEvents
 * @extends Component
 */
class SchedulePageEvents extends Component {
  /**
   * @param {Object} event being rendered
   * @returns {string} key for React
   */
  static keyExtractor = event => `list-item-${event.id}`
  /**
   * @constructor
   * @constructs SchedulePageEvents
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.dataSource = new ListView.DataSource({ rowHasChanged: (a, b) => a !== b });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <SwipeListView
        enableEmptySections
        dataSource={this.dataSource.cloneWithRows(this.props.events)}
        keyExtractor={SchedulePageEvents.keyExtractor}
        renderRow={event => <EventListItem {...event} />}
        closeOnRowBeginSwipe
      />
    );
  }
}

SchedulePageEvents.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  events: getScheduleEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePageEvents);
