import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View } from 'react-native';

import { LIGHT_GREY, DARK_TEXT_GREY } from '../../../../constants';
import { FlexRow, FlexCenter, RightAlignedColumn } from '../../../styled';
import Button from './Button';
import Overlay from './Overlay';

const Container = FlexRow.extend`
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  overflow: hidden;
  padding-top: 10;
  padding-bottom: ${props => (props.inCart ? 35 : 10)};
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

const Price = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-size: 20;
  font-family: 'flex-font-heavy';
`;

const ScheduleText = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-size: 12;
`;

const HeavyText = ScheduleText.extend`
  font-family: 'flex-font-heavy';
  font-size: 14;
`;

const ClassTime = HeavyText.extend`
  font-size: 14;
`;

/**
 * @class EventListItem
 * @extends {React.PureComponent}
 */
class EventListItem extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container inCart={Boolean(this.props.quantity)}>
        {(
          (this.props.soldOut && !this.props.waitlisted && !this.props.has_waitlist)
          || this.props.quantity
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
            <ClassTime>
              {this.props.startTimeInLocalTZ} - {this.props.endTimeInLocalTZ}
            </ClassTime>
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
          <Button {...this.props} />
        </ButtonColumn>
      </Container>
    );
  }
}

EventListItem.defaultProps = {
  has_waitlist: false,
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
};

export default EventListItem;
