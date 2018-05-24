import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { promisify } from 'bluebird';
import { Alert } from 'react-native';
import styled from 'styled-components';

import Config from '../../../../config.json';
import { GREY, WHITE, DARK_TEXT_GREY } from '../../../constants/index';
import { addToCart, addToWaitlist } from '../../../actions';
import { lightenDarkenColor } from '../../../helpers';
import DibsLoader from '../../shared/DibsLoader';
import MaterialButton from '../../shared/MaterialButton';
import { HeavyText } from '../../styled';

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
   * @constructor
   * @constructs Button
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { waitlisting: false };
    this.addToWaitlist = this.addToWaitlist.bind(this);
    this.onPress = this.onPress.bind(this);
    this.getBackgroundColor = this.getBackgroundColor.bind(this);
    this.getText = this.getText.bind(this);
    this.getTextColor = this.getTextColor.bind(this);
  }
  /**
   * @returns {undefined}
   */
  onPress() {
    if (this.props.maxSeatsReached) {
      return Alert.alert(
        'Add to Waitlist',
        `Do you want to be added to the waitlist for ${this.props.name}?`,
        [
          { text: 'Yes', onPress: this.addToWaitlist },
          { text: 'No', onPress: () => {} },
        ]
      );
    }
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
   * @returns {string} color for button
   */
  getBackgroundColor() {
    if (this.props.waitlisted) return WHITE;
    if (this.props.maxSeatsReached && this.props.has_waitlist) return lightenDarkenColor(GREY, 16);
    if (this.props.soldOut) return WHITE;
    return Config.STUDIO_COLOR;
  }
  /**
   * @returns {string} text for button
   */
  getText() {
    if (this.props.waitlisted) return 'Waitlisted';
    if (this.props.soldOut && this.props.has_waitlist) return 'Waitlist';
    if (this.props.soldOut) return 'Sold Out';
    return 'Book';
  }
  /**
   * @returns {string} text color
   */
  getTextColor() {
    if (this.props.waitlisted || (this.props.soldOut && !this.props.has_waitlist)) {
      return GREY;
    }
    return WHITE;
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
    if (this.state.waitlisting) {
      return (
        <DibsLoader
          width={80}
          maxDotRadius={10}
          dotColor={Config.STUDIO_COLOR}
        />
      );
    }
    const shouldHaveBorder =
      this.props.waitlisted
      || (this.props.soldOut && !this.props.has_waitlist);
    return (
      <MaterialButton
        style={{
          width: 80,
          height: 40,
          borderWidth: Number(shouldHaveBorder),
          borderColor: GREY,
        }}
        backgroundColor={this.getBackgroundColor()}
        text={this.getText()}
        textColor={this.getTextColor()}
        fontSize={this.props.waitlisted ? 12 : 14}
        onPress={this.onPress}
        disabled={this.props.waitlisted}
      />
    );
  }
}

Button.defaultProps = {
  showOverlay() {},
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
  waitlisted: PropTypes.bool.isRequired,
  soldOut: PropTypes.bool.isRequired,
  locationName: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  showOverlay: PropTypes.func,
};

const mapStateToProps = null; // state => ({});
const mapDispatchToProps = {
  addToCart,
  addToWaitlist,
};

export default connect(mapStateToProps, mapDispatchToProps)(Button);
