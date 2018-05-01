import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SwipeListView } from 'react-native-swipe-list-view';
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
    this.renderItem = this.renderItem.bind(this);
    this.renderHiddenControls = this.renderHiddenControls.bind(this);
  }
  /**
   *
   * @param {Object} item the event
   * @param {number} index in the array
   * @returns {JSX} event list item component
   */
  renderItem({ item, index }) {
    return (
      <EventListItem
        index={index}
        {...item}
        studioColor={this.props.studioColor}
      />
    );
  }
  /**
   *
   * @param {Object} item the event
   * @param {number} index in the array
   * @returns {JSX} hidden swipe controls for event list
   */
  renderHiddenControls({ item, index }) {
    return (
      <HiddenControls
        index={index}
        leftText={item.leftText}
        leftAction={item.leftAction}
        rightText={item.rightText}
        rightAction={item.rightAction}
      />
    );
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <SwipeListView
        useFlatList
        data={this.props.events}
        keyExtractor={SchedulePageEvents.keyExtractor}
        renderItem={this.renderItem}
        renderHiddenItem={this.renderHiddenControls}
        leftOpenValue={180}
        rightOpenValue={-180}
        swipeToOpenPercent={99}
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
