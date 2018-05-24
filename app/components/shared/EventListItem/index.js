import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View } from 'react-native';

import { WHITE, LIGHT_GREY, DARK_TEXT_GREY } from '../../../constants';
import { FlexRow, FlexCenter, RightAlignedColumn, HeavyText } from '../../styled';
import Button from './Button';
import Overlay from './Overlay';

const Container = FlexRow.extend`
  background: ${WHITE},
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  overflow: hidden;
  padding-top: 10;
  padding-bottom: ${props => (props.showOverlay ? 40 : 10)};
  position: relative;
`;

const PriceColumn = FlexCenter.extend`
  flex-basis: 25%;
`;

const CenterColumn = styled.View`
  flex-basis: 45%;
  padding-horizontal: 5;
`;

const ButtonColumn = FlexCenter.extend`
  flex-basis: 30%;
`;

const Price = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 20;
`;

const ScheduleText = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-size: 12;
`;

/**
 * @class EventListItem for SchedulePage and CartPage
 * @extends {React.PureComponent}
 */
class EventListItem extends React.PureComponent {
  /**
   * @constructor
   * @constructs EventListItem
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { showOverlay: props.isCartEvent };
    this.showOverlayAndStartTimer = this.showOverlayAndStartTimer.bind(this);
  }
  /**
   * @param {Object} props component will get
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.quantity !== this.props.quantity && props.quantity) {
      this.showOverlayAndStartTimer();
    }
    if (!props.quantity) {
      this.setState({ showOverlay: false });
    }
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
  }
  /**
   * @returns {undefined}
   */
  showOverlayAndStartTimer() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
    this.setState({ showOverlay: true });
    this.overlayTimeout = setTimeout(() => {
      this.setState({ showOverlay: false });
      this.overlayTimeout = null;
    }, 1e4);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container showOverlay={this.state.showOverlay}>
        {(
          (this.props.soldOut && !this.props.waitlisted && !this.props.has_waitlist)
          || this.state.showOverlay
        ) ? (
          <Overlay {...this.props} />
        ) : null}
        <PriceColumn>
          {this.props.passid ? (
            <RightAlignedColumn>
              <ScheduleText>
                Credit back
              </ScheduleText>
              <Price style={{ fontSize: 16 }}>
                +{this.props.formattedValueBack}
              </Price>
            </RightAlignedColumn>
          ) : (
            <Price>
              {this.props.formattedRoundedPrice}
            </Price>
          )}
        </PriceColumn>
        <CenterColumn>
          <View style={{ marginBottom: 10 }}>
            <HeavyText>
              {this.props.startTimeInLocalTZ} - {this.props.endTimeInLocalTZ}
            </HeavyText>
            <ScheduleText numberOfLines={1}>
              {this.props.locationName}
            </ScheduleText>
          </View>
          <View>
            <HeavyText numberOfLines={1}>
              {this.props.name}
            </HeavyText>
            <ScheduleText numberOfLines={1}>
              {this.props.instructorName}
            </ScheduleText>
          </View>
        </CenterColumn>
        <ButtonColumn>
          <Button
            {...this.props}
            showOverlay={this.showOverlayAndStartTimer}
          />
        </ButtonColumn>
      </Container>
    );
  }
}

EventListItem.defaultProps = {
  has_waitlist: false,
  isCartEvent: false,
};

EventListItem.propTypes = {
  formattedRoundedPrice: PropTypes.string.isRequired,
  passid: PropTypes.number,
  formattedValueBack: PropTypes.string,
  name: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
  startTimeInLocalTZ: PropTypes.string.isRequired,
  endTimeInLocalTZ: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
  soldOut: PropTypes.bool.isRequired,
  waitlisted: PropTypes.bool.isRequired,
  has_waitlist: PropTypes.bool,
  quantity: PropTypes.number.isRequired,
  isCartEvent: PropTypes.bool,
};

export default EventListItem;
