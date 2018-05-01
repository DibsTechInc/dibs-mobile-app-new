import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SwipeListView } from 'react-native-swipe-list-view';
import styled from 'styled-components';
import SchedulePageEventListItem from './SchedulePageEventListItem';
import { getEventsOnCurrentDate } from '../../selectors';

const StyledHiddenItemView = styled.View`
  align-items: center;
  background-color: #8dc63f;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  padding-right: 40;
  padding-left: 40;
`;

const StyledHiddenItemText = styled.Text`
  color: #fff;
  justify-content: center;
  font-family: 'flex-font-heavy';
`;

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
  }

  /**
   *
   * @param {Object} item the event
   * @param {number} index in the array
   * @returns {JSX} event list item component
   */
  renderItem({ item, index }) {
    return (
      <SchedulePageEventListItem
        item={item}
        index={index}
        studioColor={this.props.studioColor}
      />
    );
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    console.log(this.props.events)
    return (
      <SwipeListView
        useFlatList
        data={this.props.events}
        keyExtractor={SchedulePageEvents.keyExtractor}
        renderItem={this.renderItem}
        renderHiddenItem={() => (
          <StyledHiddenItemView>
            <StyledHiddenItemText> Drop this Class </StyledHiddenItemText>
            <StyledHiddenItemText> Add to Cart </StyledHiddenItemText>
          </StyledHiddenItemView>
        )}
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
  events: getEventsOnCurrentDate(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePageEvents);
