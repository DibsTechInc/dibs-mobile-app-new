import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { promisify } from 'bluebird';
import styled from 'styled-components';
import { isEqual } from 'lodash';

import Config from '../../../../config.json';
import { GREY, WHITE, DARK_TEXT_GREY } from '../../../constants';
import {
  addToWaitlist,
  enqueueNotice,
  setCurrentSpotBookingEventId,
} from '../../../actions';

import {
  getStudioHasSpotBooking,
  getShouldDisplayPaymentWarning,
} from '../../../selectors';

import { lightenDarkenColor, Enum } from '../../../helpers';
import MaterialButton from '../../shared/MaterialButton';
import { HeavyText } from '../../styled';

const ButtonStates = Enum([
  'Available',
  'SoldOut',
  'Waitlist',
  'Waitlisted',
  'Booked',
  'BookedDisabled', // case when you booked a class and cannot book again
]);

const BACKGROUND_COLOR = {
  [WHITE]: [ButtonStates.SoldOut, ButtonStates.Waitlisted, ButtonStates.Booked, ButtonStates.BookedDisabled],
  [lightenDarkenColor(GREY, 16)]: [ButtonStates.Waitlist],
  [Config.STUDIO_COLOR]: [ButtonStates.Available],
};

const BORDER_COLOR = {
  [GREY]: [ButtonStates.BookedDisabled, ButtonStates.SoldOut, ButtonStates.Waitlist, ButtonStates.Waitlisted],
  [Config.STUDIO_COLOR]: [ButtonStates.Available, ButtonStates.Booked],
};

const TEXT_COLOR = {
  [WHITE]: [ButtonStates.Available, ButtonStates.Waitlist],
  [Config.STUDIO_COLOR]: [ButtonStates.Booked],
  [GREY]: [ButtonStates.SoldOut, ButtonStates.BookedDisabled, ButtonStates.Waitlisted],
};

const TEXT = {
  Book: [ButtonStates.Available],
  Booked: [ButtonStates.Booked, ButtonStates.BookedDisabled],
  'Sold Out': [ButtonStates.SoldOut],
  Waitlist: [ButtonStates.Waitlist],
  Waitlisted: [ButtonStates.Waitlisted],
};


const StudioColoredQuantity = styled.TouchableOpacity`
  align-items: center;
  border-color: ${Config.STUDIO_COLOR};
  border-radius: 5;
  border-width: 1;
  justify-content: center;
  height: 40px;
  width: 40px;
`;

const QuantityDisplay = styled(HeavyText)`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
`;

/**
 * @class Button
 * @extends {React.PureComponent}
 */
class Button extends React.PureComponent {
  /**
   * @static
   * @param {Object} props for determining new buton state
   * @returns {number} current button state based on props
   */
  static getButtonState(props) {
    switch (true) {
      case Boolean(props.soldOut && props.userHasBooked && !props.waitlisted):
        return ButtonStates.BookedDisabled;

      case Boolean(props.waitlisted):
        return ButtonStates.Waitlisted;

      case Boolean(props.soldOut && props.has_waitlist):
        return ButtonStates.Waitlist;

      case Boolean(props.soldOut):
        return ButtonStates.SoldOut;

      case Boolean(props.userHasBooked):
        return ButtonStates.Booked;

      default:
        return ButtonStates.Available;
    }
  }

  /**
   * @constructor
   * @constructs Button
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      waitlisting: false,
      buttonState: Button.getButtonState(props),
    };

    this.onPress = this.onPress.bind(this);
    this.addToWaitlist = this.addToWaitlist.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.getBackgroundColor = this.getStyleFromObject.bind(this, BACKGROUND_COLOR);
    this.getBorderColor = this.getStyleFromObject.bind(this, BORDER_COLOR);
    this.getText = this.getStyleFromObject.bind(this, TEXT);
    this.getTextColor = this.getStyleFromObject.bind(this, TEXT_COLOR);
  }
  /**
   * @param {object} prevProps - the previous prop
   * @returns {undefined}
   */
  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps, this.props)) {
      this.setState({
        buttonState: Button.getButtonState(this.props),
      });
    }
  }
  /**
   * @returns {undefined}
   */
  onPress() {
    if (this.props.shouldDisplayPaymentWarning) {
      return this.props.enqueueNotice({
        title: 'Add to cart?',
        message: `Looks like you’ve already applied your unlimited pass to a class that day, so your card will be charged ${this.props.formattedRoundedPrice} for this class.`,
        buttons: [
          { text: 'CANCEL', onPress: () => {} },
          { text: 'YES', onPress: this.addToCart },
        ],
      });
    }

    if (this.props.maxSeatsReached) {
      return this.props.enqueueNotice({
        title: 'Add to waitlist?',
        message: 'If a spot opens up, we will book it for you and let you know that you are in.',
        buttons: [
          { text: 'CANCEL', onPress: () => {} },
          { text: 'JOIN', onPress: this.addToWaitlist },
        ],
      });
    }
    if (this.props.userHasBooked) {
      return this.props.enqueueNotice({
        title: 'Do you want to book another spot?',
        message: 'You already have a spot booked in this class. Click ‘yes’ to add this class to your cart.',
        buttons: [
          { text: 'CANCEL', onPress: () => { } },
          { text: 'YES', onPress: this.addToCart },
        ],
      });
    }
    if (this.props.studioHasSpotBooking) {
      this.props.setCurrentSpotBookingEventId(this.props.eventid);
    }
    return this.addToCart();
  }
  /**
   * @param {Object} obj constant styles object to match based on current state
   * @return {string} selected style property
   */
  getStyleFromObject(obj) {
    return (Object.entries(obj).find(([, states]) => states.includes(this.state.buttonState)) || [])[0];
  }
  /**
   * @returns {undefined}
   */
  addToCart() {
    this.props.addToCart();
  }
  /**
   * @returns {undefined}
   */
  async addToWaitlist() {
    await promisify(this.setState.bind(this))({ waitlisting: true });
    await this.props.addToWaitlist(this.props.eventid);
    await promisify(this.setState.bind(this))({ waitlisting: false });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (this.props.quantity) {
      return (
        <StudioColoredQuantity
          onPress={this.props.showOverlay}
          activeOpacity={1}
        >
          <QuantityDisplay>
            {this.props.quantity || 1}
          </QuantityDisplay>
        </StudioColoredQuantity>
      );
    }
    return (
      <MaterialButton
        style={{
          width: 80,
          height: 40,
          borderWidth: 1,
          borderColor: this.getBorderColor(),
        }}
        backgroundColor={this.getBackgroundColor()}
        text={this.props.text || this.getText()}
        textColor={this.getTextColor()}
        fontSize={16} // checkfontz
        onPress={this.onPress}
        disabled={this.props.waitlisted}
        loading={this.state.waitlisting}
      />
    );
  }
}

Button.defaultProps = {
  showOverlay() {},
  incrementPackageQuantity() {},
  userHasBooked: false,
  waitlisted: false,
  text: null,
};

Button.propTypes = {
  hasPackages: PropTypes.bool,
  maxSeatsReached: PropTypes.bool,
  has_waitlist: PropTypes.bool,
  addToCart: PropTypes.func.isRequired,
  eventid: PropTypes.number,
  passid: PropTypes.number,
  price: PropTypes.number,
  name: PropTypes.string,
  start_time: PropTypes.string,
  waitlisted: PropTypes.bool,
  soldOut: PropTypes.bool,
  locationName: PropTypes.string,
  instructorName: PropTypes.string,
  quantity: PropTypes.number,
  showOverlay: PropTypes.func,
  userHasBooked: PropTypes.bool,
  enqueueNotice: PropTypes.func.isRequired,
  studioHasSpotBooking: PropTypes.bool.isRequired,
  setCurrentSpotBookingEventId: PropTypes.func.isRequired,
  text: PropTypes.string,
  shouldDisplayPaymentWarning: PropTypes.bool,
  formattedRoundedPrice: PropTypes.string,
};

const mapStateToProps = state => ({
  studioHasSpotBooking: getStudioHasSpotBooking(state),
  shouldDisplayPaymentWarning: getShouldDisplayPaymentWarning(state),
});

const mapDispatchToProps = {
  addToWaitlist,
  enqueueNotice,
  setCurrentSpotBookingEventId,
};

export default connect(mapStateToProps, mapDispatchToProps)(Button);
