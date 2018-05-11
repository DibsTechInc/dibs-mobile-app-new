import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import FadeInView from '../FadeInView';
import TransactionBreakdown from '../TransactionBreakdown';

const LATITUDE = 40.726920;
const LONGITUDE = -73.995358;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

/**
 * @class UpcomingClass
 * @extends {Component}
 */
class UpcomingClass extends PureComponent {
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.map.animateToRegion({ latitude: LATITUDE, longitude: LONGITUDE, latitudeDelta: LATITUDE_DELTA, longitudeDelta: LONGITUDE_DELTA }, 1);
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ marginTop: 30 }}>
        {/* <TransactionBreakdown /> */}
        <MapView
          ref={(ref) => { this.map = ref; }}
          style={{ flex: 1, marginBottom: 30 }}
          initialRegion={{
            latitude: LATITUDE,
            longitude: LONGITUDE,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
        >
          <Marker
            coordinate={{ latitude: LATITUDE, longitude: LONGITUDE }}
            title="My marker"
            description="blahblah"
          />
        </MapView>
        <View style={{ flex: 1, margin: 10, marginTop: 10, marginLeft: 10 }}>
          <View>
            <Text style={{ fontFamily: 'flex-font-heavy' }}>Class Description:</Text>
            <Text style={{ fontFamily: 'flex-font' }}>blah blah blah</Text>
          </View>
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: 'flex-font-heavy' }}>Drop Policy:</Text>
            <Text style={{ fontFamily: 'flex-font' }}>blah blah blah</Text>
          </View>
        </View>
      </FadeInView>
    );
  }
}

export default UpcomingClass;
