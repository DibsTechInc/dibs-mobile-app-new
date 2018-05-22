import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import HTML from 'react-native-render-html';
import styled from 'styled-components';
import { View, Dimensions, ScrollView, Alert } from 'react-native';
import { promisify } from 'bluebird';
import { connect } from 'react-redux';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Config from '../../../../../config.json';
import { WHITE, DARK_TEXT_GREY } from '../../../../constants';
import { getDroppingUpcomingEvent } from '../../../../selectors';
import { dropUserFromEvent } from '../../../../actions';
import FadeInView from '../../FadeInView';
import TransactionBreakdown from '../../TransactionBreakdown';
import MaterialButton from '../../MaterialButton';
import DibsLoader from '../../DibsLoader';
import { NormalText, HeavyText, SpaceBetweenRow } from '../../../styled';
import Map from './Map';

const EventRow = SpaceBetweenRow.extend`
  align-items: center;
  padding-horizontal: 15;
  padding-vertical: 10;
  margin-bottom: 10;
`;

const EventInfo = styled.View`
  flex-basis: 75%;
`;

const HeavyEventText = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 14;
`;

const EventText = NormalText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 14;
`;

/**
 * @class UpcomingClass
 * @extends {Component}
 */
class UpcomingClass extends PureComponent {
  /**
   * @constructor
   * @constructs UpcomingClass
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.startDropClass = this.startDropClass.bind(this);
    this.dropClass = this.dropClass.bind(this);
  }
  /**
   * @returns {undefined}
   */
  startDropClass() {
    Alert.alert(
      'Are you sure?',
      `Do you want to drop ${this.props.name}?`,
      [
        { text: 'Yes', onPress: this.dropClass },
        { text: 'No', onPress: () => { } },
      ]
    );
  }
  /**
   * @returns {undefined}
   */
  async dropClass() {
    try {
      await promisify(this.props.dropUserFromEvent)(this.props.eventid);
      Alert.alert('Success!', `You were dropped from ${this.props.name}`);
    } catch (err) {
      Alert.alert('Uh oh!', err.message);
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const classDescriptionHTML = this.props.description
      && <HTML html={this.props.description} imagesMaxWidth={Dimensions.get('window').width} />;

    return (
      <FadeInView style={{ paddingTop: this.props.forReceiptPage ? 10 : 0, paddingBottom: 40, backgroundColor: WHITE }}>
        <ScrollView style={{ paddingTop: this.props.forReceiptPage ? 10 : 0, paddingBottom: 40 }}>
          <EventRow>
            <EventInfo>
              <View style={{ marginBottom: 10 }}>
                <HeavyEventText>
                  {this.props.shortDayOfWeek} {this.props.shortEventDate}
                </HeavyEventText>
                <EventText numberOfLines={1}>
                  {this.props.formattedStartTime} @ {this.props.locationName}
                </EventText>
              </View>
              <View>
                <HeavyEventText numberOfLines={1}>
                  {this.props.name}
                </HeavyEventText>
                <EventText numberOfLines={1}>
                  {this.props.instructorName}
                </EventText>
              </View>
            </EventInfo>
            <EventText>
              {this.props.quantity} spot{this.props.quantity > 1 ? 's' : ''}
            </EventText>
          </EventRow>
          <Map
            latitude={this.props.latitude}
            longitude={this.props.longitude}
            locationName={this.props.locationName}
          />
          <TransactionBreakdown
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
          <View style={{ margin: 10, marginLeft: 10 }}>
            <View>
              <HeavyText>
                Class Description:
              </HeavyText>
              <NormalText>
                {classDescriptionHTML || 'No Class Description.'}
              </NormalText>
            </View>
            <View style={{ paddingBottom: 10 }}>
              <HeavyText>
                Drop Policy:
              </HeavyText>
              <NormalText>
                {Config.STUDIO_DROP_POLICY}
              </NormalText>
            </View>
          </View>
          {!this.props.forReceiptPage && (
            <View style={{ alignItems: 'center', paddingBottom: isIphoneX() ? 80 : 40 }}>
              {this.props.dropping ? (
                <DibsLoader dotColor={Config.STUDIO_COLOR} maxDotRadius={10} width={160} />
              ) : (
                <MaterialButton
                  text="Drop"
                  style={{ width: 160, height: 40 }}
                  onPress={this.startDropClass}
                />
              )}
            </View>
          )}
        </ScrollView>
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
  dropping: PropTypes.bool.isRequired,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  shortDayOfWeek: PropTypes.string,
  shortEventDate: PropTypes.string,
  formattedStartTime: PropTypes.string,
  locationName: PropTypes.string,
  instructorName: PropTypes.string,
  quantity: PropTypes.number,
};

const mapStateToProps = state => ({
  dropping: getDroppingUpcomingEvent(state),
});
const mapDispatchToProps = {
  dropUserFromEvent,
};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingClass);
