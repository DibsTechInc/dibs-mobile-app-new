import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ActivityIndicator,
  Image,
} from 'react-native';
import _ from 'lodash';

import CalendarStrip from '../CalendarStrip';
import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData } from '../../actions/EventActions';
import { requestStudioData } from '../../actions/StudioActions';
import { setCurrentDate } from '../../actions/CurrentDateActions';
import { getEventsOnCurrentDate, getEventsLoading } from '../../selectors/EventsSelectors';
import { getStudioDibsConfig } from '../../selectors/StudioSelectors';

class SchedulePage extends Component {
  constructor(props) {
    super(props);

    this.handleDateSelected = this.handleDateSelected.bind(this);
  };

  componentDidMount() {
    this.props.requestStudioData(() => {
      this.props.requestEventData();
    });
  }

  componentDidUpdate(previousProps) {
    if (!(previousProps.currentDate.isSame(this.props.currentDate))) {
      this.props.requestEventData();
    }
  }

  // handleResponse = (response) => {
  //   this.setState({ isLoading: false , message: '' });
  //   console.log("in handle response");
  //   console.log(response);
  //   if (response.events) {
  //     console.log("in handle response events");
  //     this.props.navigator.push({
  //       title: 'Results',
  //       component: SchedulePageEvents,
  //       passProps: {listings: response.events}
  //     });
  //   } else {
  //     this.setState({ message: 'Location not recognized; please try again.'});
  //   }
  // };

  handleDateSelected(selectedDate) {
    console.log('date selected!', selectedDate);
    this.props.setCurrentDate(selectedDate);
  }


  render() {
    const stylesNotLoaded = _.isEmpty(this.props.studioConfig);

    if (stylesNotLoaded) {
      return null;
    }

    // const fontStyles = StyleSheet.flatten([
    //   styles.description,
    //   {color: `#${this.props.studioConfig.color}`}
    // ]);

    const studioColor = `#${this.props.studioConfig.color}`;

    return (
      <View style={styles.container}>
      <CalendarStrip
          calendarAnimation={{type: 'parallel', duration: 600}} // animation when switching weeks
          selection={'background'} // type of selection circle
          selectionAnimation={{duration: 300, borderWidth: 1}} // animation when selecting a date
          style={{paddingTop: 20, paddingBottom: 10}}
          calendarHeaderStyle={{color: 'white'}}
          calendarColor={studioColor} // main background color
          highlightColor={'#9265DC'} // color of the selection circle
          dateNumberStyle={{color: 'white'}}
          dateNameStyle={{color: 'white'}}
          highlightDateNumberStyle={{color: 'yellow'}}
          highlightDateNameStyle={{color: 'yellow'}}
          borderHighlightColor={'white'}
          iconContainer={{flex: 0.1}}
          onDateSelected={this.handleDateSelected}
      />
        {this.props.isLoading ? <ActivityIndicator size='large'/> : <SchedulePageEvents listings={this.props.events} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  description: {
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  container: {
    padding: 10,
    marginTop: 65,
  },
  flowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    },
  searchInput: {
    height: 36,
    padding: 4,
    marginRight: 5,
    flexGrow: 1,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#48BBEC',
    borderRadius: 8,
    color: '#48BBEC',
    },
});

SchedulePage.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape()),
  studioConfig: PropTypes.shape(),
  currentDate: PropTypes.shape(),
  requestEventData: PropTypes.func,
  requestStudioDate: PropTypes.func,
  setCurrentDate: PropTypes.func,
  isLoading: PropTypes.bool,
}

const mapStateToProps = state => ({
  events: getEventsOnCurrentDate(state),
  isLoading: getEventsLoading(state),
  studioConfig: getStudioDibsConfig(state),
  currentDate: state.currentDate,
});

const mapDispatchToProps = {
  requestEventData,
  requestStudioData,
  setCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

