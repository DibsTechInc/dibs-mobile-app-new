import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import HTML from 'react-native-render-html';
import { View, Text, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import FadeInView from '../FadeInView';
import TransactionBreakdown from '../TransactionBreakdown';
import Config from '../../../../config.json';

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
    const classDescriptionHTML = <HTML html={this.props.class.classDescription} imagesMaxWidth={Dimensions.get('window').width} />;

    return (
      <FadeInView style={{ marginTop: 20 }}>
        <TransactionBreakdown
          className={this.props.class.className}
          formattedSubtotal={`$${this.props.class.original_price}`}
          taxAmount={this.props.class.tax_amount}
          formattedTaxAmount={`${this.props.class.tax_amount}`}
          discountAmount={this.props.class.discount_amount}
          formattedDiscountAmount={`$${this.props.class.discount_amount}`}
          studioCreditAmount={this.props.class.studio_credits_spent}
          formattedStudioCreditAmount={`$${this.props.class.studio_credits_spent}`}
          formattedTotal={`$${this.props.class.chargeAmount}`}
        />
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
        <View style={{ flex: 1, margin: 10, marginTop: 10, marginLeft: 10, marginBottom: 50 }}>
          <View>
            <Text style={{ fontFamily: 'flex-font-heavy' }}>Class Description:</Text>
            <Text style={{ fontFamily: 'flex-font' }}>{this.props.class.classDescription.length ? classDescriptionHTML : 'No Class Description.'}</Text>
          </View>
          <View style={{ marginTop: 20, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'flex-font-heavy' }}>Drop Policy:</Text>
            <Text style={{ fontFamily: 'flex-font' }}>{Config.STUDIO_DROP_POLICY}</Text>
          </View>
        </View>
      </FadeInView>
    );
  }
}

UpcomingClass.propTypes = {
  class: PropTypes.shape(),
};

export default UpcomingClass;
