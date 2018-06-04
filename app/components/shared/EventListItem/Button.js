import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { promisify } from 'bluebird';
import styled from 'styled-components';

import Config from '../../../../config.json';
import { GREY, WHITE, DARK_TEXT_GREY } from '../../../constants/index';
import { addToCart, addToWaitlist, enqueueNotice } from '../../../actions';
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

const QuantityDisplay = HeavyText.extend`
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
      case Boolean(props.soldOut && props.userHasBooked):
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
   * @returns {undefined}
   */
  onPress() {
    if (this.props.maxSeatsReached) {
      return this.props.enqueueNotice({
        title: 'Add to Waitlist',
        message: `Do you want to be added to the waitlist for ${this.props.name}?`,
        buttons: [
          { text: 'Yes', onPress: this.addToWaitlist },
          { text: 'No', onPress: () => {} },
        ],
      });
    }
    if (this.props.userHasBooked) {
      return this.props.enqueueNotice({
        title: 'Are you sure?',
        message: `You already have a spot booked in ${this.props.name}, are you sure you want to book another?`,
        buttons: [
          { text: 'Yes', onPress: this.addToCart },
          { text: 'No', onPress: () => { } },
        ],
      });
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
    return this.props.addToCart({
      eventid: this.props.eventid,
      passid: this.props.passid,
      price: this.props.price,
      taxRate: this.props.taxRate,
      name: this.props.name,
      start_time: this.props.start_time,
      locationName: this.props.locationName,
      instructorName: this.props.instructorName,
    });
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
            {this.props.quantity}
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
        text={this.getText()}
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
  userHasBooked: false,
  waitlisted: false,
};

Button.propTypes = {
  maxSeatsReached: PropTypes.bool.isRequired,
  has_waitlist: PropTypes.bool,
  addToCart: PropTypes.func.isRequired,
  eventid: PropTypes.number.isRequired,
  passid: PropTypes.number,
  price: PropTypes.number.isRequired,
  taxRate: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  start_time: PropTypes.string.isRequired,
  waitlisted: PropTypes.bool,
  soldOut: PropTypes.bool.isRequired,
  locationName: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  showOverlay: PropTypes.func,
  userHasBooked: PropTypes.bool,
  enqueueNotice: PropTypes.func.isRequired,
};

const mapStateToProps = null; // state => ({});
const mapDispatchToProps = {
  addToCart,
  addToWaitlist,
  enqueueNotice,
};

export default connect(mapStateToProps, mapDispatchToProps)(Button);
