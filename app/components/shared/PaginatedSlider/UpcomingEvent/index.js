import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import HTML from 'react-native-render-html';
import Config from '../../../../../config.json';
import { WHITE, DARK_TEXT_GREY, GREY, WIDTH, BLACK } from '../../../../constants';
import {
  getDroppingUpcomingEvent,
  getStudioLateDropText,
  getStudioDibsConfig,
  getUpcomingEventDropIsEarlyCancel,
  getUserUsedPass,
  getStudioName,
} from '../../../../selectors';
import {
  dropUserFromEvent,
  removeFromWaitlist,
  setUpcomingEventSliderExpandedFalse,
  enqueueNotice,
} from '../../../../actions';
import FadeInView from '../../FadeInView';
import TransactionBreakdown from '../../TransactionBreakdown';
import MaterialButton from '../../MaterialButton';
import { NormalText, HeavyText, SpaceBetweenRow } from '../../../styled';
import { AddToCalendarButton } from '../../../shared';
import Map from './Map';
import Header from '../../../Header';

const EventRow = styled(SpaceBetweenRow)`
  align-items: center;
  padding-horizontal: 10;
  padding-vertical: 10;
  margin-bottom: 10;
  margin-right: 5;
`;

const EventInfo = styled.View`
  flex-basis: 75%;
  margin-left: 5px;
`;

const HeavyEventText = styled(HeavyText)`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
`;

const EventText = styled(NormalText)`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
  margin-top: 5;
`;

const DesciptionText = styled(NormalText)`
  margin-top: 15px;
  margin-bottom: 15px;
`;

const HeaderText = styled(HeavyText)`
  color: ${GREY};
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
    this.displayAdditionalNotice = this.displayAdditionalNotice.bind(this);
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
     * @returns {string} extra notice
     */
  displayAdditionalNotice() {
    const { passes } = this.props;
    const hasUnlimitedPass = (passes && passes.length && passes[0].studioPackage) && passes[0].studioPackage.unlimited;
    const isDibsEarlyCancel = !this.props.isOffsite && this.props.isEarlyCancel;

    let extraNotice = `You will receive credit back to your account with ${this.props.studioName}. This credit will be for the full amount you paid for this class.`;

    if (isDibsEarlyCancel && this.props.userUsedPass) {
      extraNotice = `You will get back your ${this.props.studioName} package uses you used to purchase this class.`;
    }

    if (!isDibsEarlyCancel) {
      extraNotice = 'Please note! If this drop is within 12 hours of the start of the class, you will not get any credit back to your account for dropping this class.';
      if (hasUnlimitedPass) {
        extraNotice = `${extraNotice} ${this.props.lateDropText}`;
      }
    }

    return this.props.isWaitlist ? '' : extraNotice;
  }
  /**
   * @returns {undefined}
   */
  startCancel() {
    const titleMesage = this.props.isWaitlist ? 'Remove from waitlist?' : 'Drop this class?';
    const baseNotice = `Click 'yes' to drop ${this.props.name}.`;
    const extraNotice = this.displayAdditionalNotice();

    this.props.enqueueNotice({
      title: `${titleMesage}`,
      message: `${baseNotice} ${extraNotice}`,
      buttons: [
        { text: 'YES', onPress: this.removeFromClass },
        { text: 'CANCEL', onPress: () => { } },
      ],
    });
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
    const parsedHTMLDescription = (
      <HTML
        html={this.props.formattedDescription}
        imagesMaxWidth={WIDTH}
        baseFontStyle={{
          color: BLACK,
          fontFamily: 'studio-font',
          fontSize: 16,
        }}
        ignoredStyles={['color']}
      />
    );

    const descriptionContainer = (<View style={{ margin: 10, marginLeft: 20 }}>
      <View style={{ marginBottom: 20 }}>
        <HeaderText>
          Class Description
        </HeaderText>
      </View>
      <View style={{ paddingRight: WIDTH / 20 }}>
        {parsedHTMLDescription}
      </View>
    </View>);

    const showButton = this.props.isTransactionHistory ?
      (
        <View style={{ marginRight: 10, width: 80 }}>
          <NormalText>
            {this.props.status}
          </NormalText>
        </View>
      ) :
      (
        <MaterialButton
          text={this.props.isWaitlist ? 'Cancel' : 'Drop'}
          style={{ width: 80, height: 40 }}
          onPress={this.startCancel}
          loading={this.props.dropping}
        />
      );

    const renderRightSideContent = this.props.forReceiptPage ? null : showButton;


    return (
      <FadeInView
        style={{
          paddingBottom: 60,
          backgroundColor: WHITE,
        }}
      >
        {!!this.props.hasHeader && <Header title="Class Detail" />}
        <ScrollView
          ref={node => this.scrollView = node}
          onScrollEndDrag={this.onScrollEnd}
        >
          {this.props.expanded &&
            <View style={{ margin: 10 }}>
              <NormalText style={{ fontSize: 16, color: GREY, fontFamily: 'studio-font-heavy', marginLeft: 5 }}>
                Item(s)
              </NormalText>
            </View>
          }
          <EventRow>
            <EventInfo>
              <View style={{ marginBottom: 15 }}>
                <View style={{ flexDirection: 'row' }}>
                  <HeavyEventText>
                    {this.props.shortDayOfWeek} {this.props.shortEventDate}
                  </HeavyEventText>
                  {!this.props.isTransactionHistory ? <AddToCalendarButton
                    title={`${this.props.name} w/ ${this.props.instructorName}`}
                    startDate={this.props.start_time}
                    endDate={this.props.end_time}
                    location={this.props.locationName}
                    timeZone={this.props.mainTZ}
                  /> : undefined}
                </View>
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
                {(this.props.quantity > 1 || this.props.isWaitlist) ? (
                  <EventText numberOfLines={1}>
                    {this.props.isWaitlist ? 'Waitlisted' : `${this.props.quantity} spot${this.props.quantity > 1 ? 's' : ''}`}
                  </EventText>
                ) : undefined}
              </View>
            </EventInfo>
            {renderRightSideContent}
          </EventRow>
          {!this.props.isTransactionHistory ? <Map
            latitude={this.props.latitude}
            longitude={this.props.longitude}
            locationName={this.props.locationName}
            allowInteraction={this.props.expanded}
          /> : undefined}
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
          {!this.props.isTransactionHistory && this.props.formattedDescription ? descriptionContainer : undefined}
          {!this.props.isTransactionHistory ? <View style={{ paddingBottom: 60, paddingTop: 20, marginLeft: 20, marginRight: 20 }}>
            <HeaderText>
              Drop Policy
            </HeaderText>
            <DesciptionText>
              {Config.STUDIO_DROP_POLICY}
            </DesciptionText>
            <DesciptionText>
              {this.props.lateDropText}
            </DesciptionText>
          </View> : undefined}
        </ScrollView>
      </FadeInView>
    );
  }
}

UpcomingEvent.defaultProps = {
  hasHeader: false,
  forReceiptPage: false,
  isTransactionHistory: false,
};

UpcomingEvent.propTypes = {
  forReceiptPage: PropTypes.bool,
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
  enqueueNotice: PropTypes.func.isRequired,
  lateDropText: PropTypes.string,
  userUsedPass: PropTypes.bool,
  isEarlyCancel: PropTypes.bool,
  isOffsite: PropTypes.bool,
  studioName: PropTypes.string,
  passes: PropTypes.arrayOf(PropTypes.shape()),
  start_time: PropTypes.string,
  end_time: PropTypes.string,
  mainTZ: PropTypes.string,
  isTransactionHistory: PropTypes.bool,
  hasHeader: PropTypes.bool,
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const mapStateToProps = (state, props) => ({
  dropping: getDroppingUpcomingEvent(state),
  expanded: state.animation.upcomingEventSliderExpanded,
  lateDropText: getStudioLateDropText(state),
  config: getStudioDibsConfig(state),
  userUsedPass: getUserUsedPass(state, props.eventid),
  isEarlyCancel: getUpcomingEventDropIsEarlyCancel(state, props.eventid),
  studioName: getStudioName(state),
});

const mapDispatchToProps = {
  dropUserFromEvent,
  removeFromWaitlist,
  setUpcomingEventSliderExpandedFalse,
  enqueueNotice,
};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEvent);
