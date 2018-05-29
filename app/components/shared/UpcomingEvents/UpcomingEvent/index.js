import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, ScrollView, Alert } from 'react-native';
import { connect } from 'react-redux';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Config from '../../../../../config.json';
import { WHITE, DARK_TEXT_GREY } from '../../../../constants';
import { getDroppingUpcomingEvent } from '../../../../selectors';
import {
  dropUserFromEvent,
  removeFromWaitlist,
  setUpcomingEventSliderExpandedFalse,
} from '../../../../actions';
import FadeInView from '../../FadeInView';
import TransactionBreakdown from '../../TransactionBreakdown';
import MaterialButton from '../../MaterialButton';
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

const DesciptionText = NormalText.extend`
  margin-top: 15px;
  margin-bottom: 15px;
`;

/**
 * @class UpcomingEvent
 * @extends {Component}
 */
class UpcomingEvent extends PureComponent {
  /**
   * @constructor
   * @constructs UpcomingEvent
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.onScrollEnd = this.onScrollEnd.bind(this);
    this.startCancel = this.startCancel.bind(this);
    this.removeFromClass = this.removeFromClass.bind(this);
  }
  /**
   * @param {Object} props component is about to get
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.expanded !== this.props.expanded) {
      this.scrollView.scrollTo({ y: 0, animated: false });
    }
  }
  /**
   * @param {Object} ev the scroll event
   * @returns {undefined}
   */
  onScrollEnd(ev) {
    if (ev.nativeEvent.contentOffset.y < -20 && !this.props.forReceiptPage) {
      this.props.setUpcomingEventSliderExpandedFalse();
    }
  }
  /**
   * @returns {undefined}
   */
  startCancel() {
    Alert.alert(
      'Are you sure?',
      `Do you want to drop ${this.props.name}?`,
      [
        { text: 'Yes', onPress: this.removeFromClass },
        { text: 'No', onPress: () => { } },
      ]
    );
  }
  /**
   * @returns {undefined}
   */
  async removeFromClass() {
    if (this.props.isWaitlist) return this.props.removeFromWaitlist(this.props.eventid);
    return this.props.dropUserFromEvent(this.props.eventid);
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView
        style={{
          paddingTop: this.props.forReceiptPage ? 10 : 0,
          paddingBottom: isIphoneX() ? 80 : +(!this.props.forReceiptPage && 60),
          backgroundColor: WHITE,
        }}
      >
        <ScrollView
          ref={node => this.scrollView = node}
          style={{
            paddingTop: this.props.forReceiptPage ? 10 : 0,
          }}
          onScrollEndDrag={this.onScrollEnd}
        >
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
                {(this.props.quantity > 1 || this.props.isWaitlist) && (
                  <EventText numberOfLines={1}>
                    {this.props.isWaitlist ? 'Waitlisted' : `${this.props.quantity} spot${this.props.quantity > 1 ? 's' : ''}`}
                  </EventText>
                )}
              </View>
            </EventInfo>
            {this.props.forReceiptPage ? null : (
              <View style={{ alignItems: 'center' }}>
                <MaterialButton
                  text={this.props.isWaitlist ? 'Cancel' : 'Drop'}
                  style={{ width: 80, height: 40 }}
                  onPress={this.startCancel}
                  loading={this.props.dropping}
                />
              </View>
            )}
          </EventRow>
          <Map
            latitude={this.props.latitude}
            longitude={this.props.longitude}
            locationName={this.props.locationName}
            allowInteraction={this.props.expanded}
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
              <DesciptionText>
                {this.props.formattedDescription}
              </DesciptionText>
            </View>
            <View style={{ paddingBottom: 60 }}>
              <HeavyText>
                Drop Policy:
              </HeavyText>
              <DesciptionText>
                {Config.STUDIO_DROP_POLICY}
              </DesciptionText>
            </View>
          </View>
        </ScrollView>
      </FadeInView>
    );
  }
}

UpcomingEvent.propTypes = {
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
  formattedDescription: PropTypes.string,
  dropping: PropTypes.bool.isRequired,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  shortDayOfWeek: PropTypes.string,
  shortEventDate: PropTypes.string,
  formattedStartTime: PropTypes.string,
  locationName: PropTypes.string,
  instructorName: PropTypes.string,
  quantity: PropTypes.number,
  expanded: PropTypes.bool.isRequired,
  isWaitlist: PropTypes.bool,
  removeFromWaitlist: PropTypes.func.isRequired,
  eventid: PropTypes.number.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  dropping: getDroppingUpcomingEvent(state),
  expanded: state.animation.upcomingEventSliderExpanded,
});
const mapDispatchToProps = {
  dropUserFromEvent,
  removeFromWaitlist,
  setUpcomingEventSliderExpandedFalse,
};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEvent);
