import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SwipeListView } from 'react-native-swipe-list-view';
import Moment from 'moment';
import { View, Text } from 'react-native';
import styled from 'styled-components';

import SchedulePageEventListItem from './SchedulePageEventListItem';

const StyledHiddenItemView = styled.View`
  align-items: center;
  background-color: #8dc63f;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  padding-right: 20;
  padding-left: 20;
`;

const StyledHiddenItemText = styled.Text`
  color: #fff;
  justify-content: center;
`;

class SchedulePageEvents extends Component {
  keyExtractor = (item, index) => `list-item-${index}`
  
  renderItem = ({item, index}) => (
    <SchedulePageEventListItem
      item={item}
      index={index}
      studioColor={this.props.studioColor}
    />
  );

  render() {
    return (
      <SwipeListView
        useFlatList
        data={this.props.listings}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        renderHiddenItem={ (data, rowMap) => (
            <StyledHiddenItemView>
              <StyledHiddenItemText>Drop this Class</StyledHiddenItemText>
              <StyledHiddenItemText>Add to Cart</StyledHiddenItemText>
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
  listings: PropTypes.arrayOf(PropTypes.shape()),
}

export default SchedulePageEvents;
