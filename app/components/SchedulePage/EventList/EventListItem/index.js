import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';
import styled from 'styled-components';
import { View } from 'react-native';
import { LIGHT_GREY, TEXT_GREY } from '../../../../constants';
import {
  getUsersNextPassValue,
  getUsersNextPassId,
} from '../../../../selectors';
import { FlexRow, FlexCenter, RightAlignedColumn } from '../../../styled';
import Button from './Button';
import Overlay from './Overlay';

const Container = FlexRow.extend`
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  padding-vertical: 10;
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
  font-size: 20;
  font-family: 'flex-font-heavy';
`;

const ScheduleText = styled.Text`
  color: ${TEXT_GREY};
  font-size: 12;
`;

const HeavyText = ScheduleText.extend`
  font-family: 'flex-font-heavy';
`;

const ClassTime = HeavyText.extend`
  font-size: 16;
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
      <Container>
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
                Value back:
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
          <View style={{ marginBottom: 5 }}>
            <ClassTime>
              {this.props.startTimeInLocalTZ} - {this.props.endTimeInLocalTZ}
            </ClassTime>
          </View>
          <View>
            <HeavyText>
              {this.props.name}
            </HeavyText>
            <ScheduleText>
              {this.props.instructorName}
            </ScheduleText>
            <ScheduleText>
              {this.props.locationName}
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

const mapStateToProps = (state, props) => {
  const passValue = getUsersNextPassValue(state)(props.eventid);
  const valueBack = passValue ? Math.max(0, Decimal(passValue || 0).minus(props.price).toDecimalPlaces(2).toNumber()) : 0;
  return {
    passid: getUsersNextPassId(state)(props.eventid),
    valueBack,
    formattedValueBack: formatCurrency(valueBack, { precision: (valueBack % 1 && 2), code: props.currency }),
    alreadyPreviewed: state.events.previewed,
  };
};
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(EventListItem);
