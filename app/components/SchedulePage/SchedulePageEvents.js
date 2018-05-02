import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import { ListView, TouchableHighlight } from 'react-native';
import EventListItem from './EventListItem';
import HiddenControls from './EventListItem/HiddenControls';
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
    this.renderRow = this.renderRow.bind(this);
    this.dataSource = new ListView.DataSource({ rowHasChanged: (a, b) => a !== b });
  }
  /**
   * @param {Object} event, see selectors/EventSelectors for structure
   * @returns {JSX} event list item component
   */
  renderRow(event) {
    return (
      <SwipeRow
        leftOpenValue={180}
        rightOpenValue={-180}
        swipeToOpenPercent={99}
        disableRightSwipe={!event.quantity}
        disableLeftSwipe={event.soldOut || event.maxSeatsReached}
      >
        <HiddenControls {...event} />
        <TouchableHighlight>
          <EventListItem
            {...event}
            studioColor={this.props.studioColor}
          />
        </TouchableHighlight>
      </SwipeRow>
    );
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
        renderRow={this.renderRow}
      />
    );
  }
}

SchedulePageEvents.propTypes = {
  studioColor: PropTypes.string,
  events: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  events: getScheduleEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePageEvents);
