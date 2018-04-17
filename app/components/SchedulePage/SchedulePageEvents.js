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
    const duration = Moment.utc(+d).format('mm') + " minutes";
  
    return (
      <TouchableHighlight
        onPress={this.onPress}
        underlayColor='#dddddd'>
        <View>
          <View style={styles.rowContainer}>
              <View style={styles.columnContainer}>
                <Text style={styles.title}>{startTime}</Text>
                <Text style={styles.title}>{duration}</Text>
              </View>
              <View style={styles.columnContainer}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.title}>{item.instructor.name}</Text>
              </View>
              <View style={styles.columnContainer}>
                  <Text style={styles.title}>{item.location.name}</Text>
              </View>
              <View style={styles.columnContainer}>
                  <Text style={styles.price}>{price}</Text>
              </View>
              <Svg height="60" width="60">
                  <Circle
                      cx="30"
                      cy="30"
                      r="20"
                      fill="#8dc63f"
                  />
              </Svg>
          </View>
          <View style={styles.separator}/>
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
    textContainer: {
        flex: 1
    },
    separator: {
        height: 1,
        backgroundColor: '#dddddd'
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#656565'
    },
    title: {
        fontSize: 12,
        color: '#656565',
    },
    rowContainer: {
        flexDirection: 'row',
        padding: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    columnContainer: {
      flexDirection: 'column',
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
});

