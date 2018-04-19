import React, { Component } from 'react';
import { SwipeListView } from 'react-native-swipe-list-view';
import Moment from 'moment';

import {
  StyleSheet,
  Image,
  View,
  TouchableHighlight,
  FlatList,
  Text,
} from 'react-native';

import Svg,{
  Circle,
  Line,
} from 'react-native-svg';

import styled from 'styled-components';

const StyledRowContainer = styled.View`
  flex-direction: row;
  padding: 5px;
  justify-content: space-between;
  align-items: center;
`;

const StyledColumnContainer = styled.View`
  flex-direction: column;
  padding: 10px;
  justify-content: center;
  align-items: center;
  flex-basis: 25%;
`;

const StyledTitle = styled.Text`
  font-size: 12px;
  color: #656565;
`;

const StyledPrice = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #656565;
`;

const StyledSeparator = styled.View`
  height: 1px;
  backgroundColor: #dddddd;
`;

class SchedulePageEvents extends Component {
  keyExtractor = (item, index) => `list-item-${index}`
  
  renderItem = ({item, index}) => (
    <ListItem
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
            <View style={styles.rowBack}>
              <Text style={styles.rowBackText}>Drop this Class</Text>
              <Text style={styles.rowBackText}>Add to Cart</Text>
            </View>
        )}
        onRowClose={() => { console.log('action received!') }}
      />
    );
  }
}

class ListItem extends React.PureComponent {
  render() {
    const item = this.props.item;
    const price = "$" + item.price;
    const startTime = Moment(item.start_time).format('h:mm a');
    const end = Moment.utc(item.end_time, "HH:mm");
    const start = Moment.utc(item.start_time, "HH:mm");
    const d = Moment.duration(end.diff(start));
    const duration = Moment.utc(+d).format('mm') + " min";
  
    return (
      <View style={styles.rowFront}>
        <StyledRowContainer>
            <StyledColumnContainer>
              <StyledTitle>{startTime}</StyledTitle>
              <StyledTitle>{duration}</StyledTitle>
            </StyledColumnContainer>
            <StyledColumnContainer>
              <StyledTitle>{item.name}</StyledTitle>
              <StyledTitle>{item.instructor.name}</StyledTitle>
            </StyledColumnContainer>
            <StyledColumnContainer>
                <StyledTitle>{item.location.name}</StyledTitle>
            </StyledColumnContainer>
            <StyledColumnContainer>
                <StyledPrice>{price}</StyledPrice>
            </StyledColumnContainer>
        </StyledRowContainer>
        <StyledSeparator />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  rowBack: {
    alignItems: 'center',
		backgroundColor: '#8dc63f',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
    paddingRight: 20,
    paddingLeft: 20,
  },
  rowBackText: {
    color: '#fff',
    marginRight: 30,
  },
  rowFront: {
    alignItems: 'center',
		backgroundColor: '#fff',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: 'lightgray',
  },
});

export default SchedulePageEvents;
