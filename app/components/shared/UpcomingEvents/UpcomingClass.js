import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import HTML from 'react-native-render-html';
import { View, Text, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import FadeInView from '../FadeInView';
import TransactionBreakdown from '../TransactionBreakdown';
import Config from '../../../../config.json';

const LATITUDE = 51.5211117;
const LONGITUDE = -0.090806;
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
    const classDescriptionHTML = this.props.description
      && <HTML html={this.props.description} imagesMaxWidth={Dimensions.get('window').width} />;

    return (
      <FadeInView style={{ marginTop: this.props.forReceiptPage ? 20 : 0 }}>
        <TransactionBreakdown
          forReceiptPage={this.props.forReceiptPage}
          name={this.props.name}
          formattedSubtotal={this.props.formattedSubtotal}
          taxAmount={this.props.tax_amount}
          formattedTaxAmount={this.props.formattedTaxAmount}
          discountAmount={this.props.discount_amount}
          formattedDiscountAmount={this.props.formattedDiscountAmount}
          studioCreditAmount={this.props.studio_credits_spent}
          formattedStudioCreditAmount={this.props.formattedStudioCreditAmount}
          rafCreditsSpent={this.props.raf_credits_spent}
          formattedRAFCreditAmount={this.props.formattedRAFCreditAmount}
          formattedTotal={this.props.formattedTotal}
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
            <Text style={{ fontFamily: 'flex-font-heavy' }}>
              Class Description:
            </Text>
            <Text style={{ fontFamily: 'flex-font' }}>
              {classDescriptionHTML || 'No Class Description.'}
            </Text>
          </View>
          <View style={{ marginTop: 20, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'flex-font-heavy' }}>
              Drop Policy:
            </Text>
            <Text style={{ fontFamily: 'flex-font' }}>
              {Config.STUDIO_DROP_POLICY}
            </Text>
          </View>
        </View>
      </FadeInView>
    );
  }
}

UpcomingClass.propTypes = {
  forReceiptPage: PropTypes.bool.isRequired,
  formattedSubtotal: PropTypes.string,
  name: PropTypes.string,
  tax_amount: PropTypes.number,
  formattedTaxAmount: PropTypes.string,
  discount_amount: PropTypes.number,
  formattedDiscountAmount: PropTypes.string,
  studio_credits_spent: PropTypes.number,
  formattedStudioCreditAmount: PropTypes.string,
  raf_credits_spent: PropTypes.number,
  formattedRAFCreditAmount: PropTypes.string,
  formattedTotal: PropTypes.string,
  description: PropTypes.string,
};

export default UpcomingClass;
