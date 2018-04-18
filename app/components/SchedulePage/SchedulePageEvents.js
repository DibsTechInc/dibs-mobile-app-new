import React, { Component } from 'react';
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
  flex-basis: 20%;
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

export default class SchedulePageEvents extends Component {
  keyExtractor = (item, index) => `list-item-${index}`
  
  renderItem = ({item, index}) => (
    <ListItem
      item={item}
      index={index}
      onPressItem={this.onPressItem}
    />
  );

  onPressItem = (index) => {
    console.log("Pressed row: "+index);
  };

  render() {
    return (
      <FlatList
        data={this.props.listings}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
      />
    );
  }
}

class ListItem extends React.PureComponent {
  onPress = () => {
      this.props.onPressItem(this.props.index);
    }
  
  render() {
    const item = this.props.item;
    const price = "$" + item.price;
    const startTime = Moment(item.start_time).format('h:mm a');
    const end = Moment.utc(item.end_time, "HH:mm");
    const start = Moment.utc(item.start_time, "HH:mm");
    const d = Moment.duration(end.diff(start));
    const duration = Moment.utc(+d).format('mm') + " min";
  
    return (
      <View>
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
            <TouchableHighlight 
              onPress={this.onPress}
              underlayColor='#fff'
            >
              <Svg height="60" width="60">
                  <Circle
                      cx="30"
                      cy="30"
                      r="20"
                      fill="#8dc63f"
                  />
              </Svg>
            </TouchableHighlight>
        </StyledRowContainer>
        <StyledSeparator />
      </View>
    );
  }
}

