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

import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData } from '../../actions/EventActions';
import { getEventsData } from '../../selectors/Events';

class SearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchString: 'london',
      isLoading: false,
      message: '',
    };
  };

  componentDidMount() {
    this.props.requestEventData();
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


  render() {
    console.log(this.props.events, 'events')
    const spinner = this.state.isLoading ? <ActivityIndicator size='large'/> : null;
    
    return (
      <View style={styles.container}>
        <Text style={styles.description}>
          React Native Slick
        </Text>
        <SchedulePageEvents listings={this.props.events} />
      </View>
    );
  }
}

SearchPage.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape()),
  requestEventData: PropTypes.func,
}

const styles = StyleSheet.create({
  description: {
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
    color: 'blue'
  },
  container: {
    padding: 30,
    marginTop: 65,
    alignItems: 'center'
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

const mapStateToProps = state => ({
  events: getEventsData(state),
});

const mapDispatchToProps = {
  requestEventData,
};

export default connect(mapStateToProps, mapDispatchToProps)(SearchPage)

