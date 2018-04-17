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

import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData } from '../../actions/EventActions';
import { requestStudioData } from '../../actions/StudioActions';
import { getEventsData, getEventsLoading } from '../../selectors/EventsSelectors';
import { getStudioDibsConfig } from '../../selectors/StudioSelectors';

class SchedulePage extends Component {
  constructor(props) {
    super(props);
  };

  componentDidMount() {
    this.props.requestStudioData(() => {
      this.props.requestEventData();
    });
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
    const stylesNotLoaded = _.isEmpty(this.props.studioConfig);

    if (stylesNotLoaded) {
      return null;
    }

    const fontStyles = StyleSheet.flatten([
      styles.description,
      {color: `#${this.props.studioConfig.color}`}
    ]);

    return (
      <View style={styles.container}>
        <Text style={fontStyles}>
          React Native Slick
        </Text>
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
    padding: 30,
    marginTop: 65,
    alignItems: 'center',
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
  requestEventData: PropTypes.func,
  requestStudioDate: PropTypes.func,
  isLoading: PropTypes.bool,
}

const mapStateToProps = state => ({
  events: getEventsData(state),
  isLoading: getEventsLoading(state),
  studioConfig: getStudioDibsConfig(state),
});

const mapDispatchToProps = {
  requestEventData,
  requestStudioData,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

