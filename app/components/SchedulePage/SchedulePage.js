import React, { Component } from 'react';
import EventsResults from './SchedulePageResults';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ActivityIndicator,
  Image,
} from 'react-native';

function urlForQueryAndPage(key, value, pageNumber) {
  const data = {
    country: 'uk',
    pretty: '1',
    encoding: 'json',
    listing_type: 'buy',
    action: 'search_listings',
    page: pageNumber,
  };
  data[key] = value;
  
  const querystring = Object.keys(data)
    .map(key => key + '=' + encodeURIComponent(data[key]))
    .join('&');
  
    // react native does not allow localhost - must enter actual local host address
  return 'http://10.51.110.1:3000/api/studio/events?studios[0]=1&start=2018-04-16%2000:00:00&end=2018-04-16%2023:59:59';
}

export default class SearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchString: 'london',
      isLoading: false,
      message: '',
    };
  };

  onSearchTextChanged = (event) => {
    console.log('_onSearchTextChanged');
    this.setState({ searchString: event.nativeEvent.text });
    console.log('Current: '+this.state.searchString+', Next: '+event.nativeEvent.text);
  };

  executeQuery = (query) => {
    console.log(query);
    this.setState({ isLoading: true });
    fetch(query)
      .then(response => response.json())
      .then(response => this.handleResponse(response))
      .catch(error =>
        this.setState({
          isLoading: false,
          message: 'Something bad happened ' + error
        }),
      );
  }; 

  handleResponse = (response) => {
    this.setState({ isLoading: false , message: '' });
    console.log("in handle response");
    console.log(response);
    if (response.events) {
      console.log("in handle response events");
      this.props.navigator.push({
        title: 'Results',
        component: EventsResults,
        passProps: {listings: response.events}
      });
    } else {
      this.setState({ message: 'Location not recognized; please try again.'});
    }
  };

  onSearchPressed = () => {
    const query = urlForQueryAndPage('place_name', this.state.searchString, 1);
    this.executeQuery(query);
  };

  render() {
    const spinner = this.state.isLoading ? <ActivityIndicator size='large'/> : null;
    
    return (
      <View style={styles.container}>
        <Text style={styles.description}>
          Test loading schedule page...
        </Text>
        <View style={styles.flowRight}>
          <Button
            onPress={this.onSearchPressed}
            color='#48BBEC'
            title='Go'
          />
        </View>
        {spinner}
        <Text style={styles.description}>{this.state.message}</Text>
      </View>
    );
  }
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
