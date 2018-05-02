import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Decimal from 'decimal.js';
import { connect } from 'react-redux';
import { SwipeRow } from 'react-native-swipe-list-view';
import { TouchableHighlight } from 'react-native';
import { format as formatCurrency } from 'currency-formatter';
import { WHITE, TEXT_GREY, LIGHT_GREY, GREEN, GREY } from '../../../constants';
import {
  getUsersNextPassValue,
  getUsersNextPassId,
} from '../../../selectors';
import HiddenControls from './HiddenControls';
import { lightenDarkenColor } from '../../../helpers';
import Config from '../../../../config.json';

const shadowColor = lightenDarkenColor(Config.STUDIO_COLOR, -20);

const StyledListItemView = styled.View`
  align-items: center;
  background-color: ${WHITE};
  justify-content: center;
  border-bottom-width: 6;
  border-right-width: 3;
  border-left-width: 1;
  margin: 6px;
  border-radius: 20px;
  border-color: ${shadowColor};
`;

const StyledRowContainer = styled.View`
  flex-direction: row;
  padding: 10px;
  justify-content: space-between;
  align-items: center;
`;

const StyledColumnContainer = styled.View`
  flex-direction: column;
  padding: 15px;
  justify-content: center;
  align-items: center;
  flex-basis: 25%;
`;

const StyledTitle = styled.Text`
  font-size: 13px;
  font-family: 'flex-font';
  color: ${TEXT_GREY};
  text-align: center;
`;

const StyledTitleHeavy = StyledTitle.extend`
  font-family: 'flex-font-heavy';
  text-align: center;
`;

const StyledPrice = styled.Text`
  font-size: 18px;
  font-family: 'flex-font-heavy';
  text-decoration-style: solid;
`;

const StyledValueBack = styled.Text`
  color: ${GREEN};
  font-size: 14px;
  font-family: 'flex-font';
`;

const StyledSoldOut = styled.Text`
  color: ${GREY};
  font-size: 16px;
  font-family: 'flex-font-heavy';
  text-align: center;
`;

/**
 * @class SchedulePageEventListItem
 * @extends PureComponent
 */
class EventListItem extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    const priceStyles = {
      color: this.props.passid ? LIGHT_GREY : TEXT_GREY,
      textDecorationLine: this.props.passid ? 'line-through' : undefined,
    };
    const priceComponent = this.props.soldOut ? (
      <StyledColumnContainer>
        <StyledSoldOut>
          SOLD{'\n'}
          OUT
        </StyledSoldOut>
      </StyledColumnContainer>
    ) : (
      <StyledColumnContainer>
        <StyledPrice style={priceStyles}>
          {this.props.formattedRoundedPrice}
        </StyledPrice>
        {Boolean(this.props.valueBack) && (
          <StyledValueBack>
            +{this.props.formattedValueBack}
          </StyledValueBack>
        )}
      </StyledColumnContainer>
    );

    return (
      <SwipeRow
        // leftOpenValue={180}
        // rightOpenValue={-180}
        // swipeToOpenPercent={99}
        disableRightSwipe={!event.quantity}
        disableLeftSwipe={event.soldOut || event.maxSeatsReached}
      >
        <HiddenControls {...this.props} />
        <TouchableHighlight>
          <StyledListItemView>
            <StyledRowContainer>
              <StyledColumnContainer>
                <StyledTitleHeavy>
                  {this.props.startTimeInLocalTZ}
                </StyledTitleHeavy>
                <StyledTitle>
                  {this.props.timeDuration} min
                </StyledTitle>
              </StyledColumnContainer>
              <StyledColumnContainer>
                <StyledTitleHeavy>
                  {this.props.name}
                </StyledTitleHeavy>
                <StyledTitle>
                  {this.props.instructorName}
                </StyledTitle>
              </StyledColumnContainer>
              <StyledColumnContainer>
                <StyledTitleHeavy>
                  {this.props.locationName}
                </StyledTitleHeavy>
              </StyledColumnContainer>
              {priceComponent}
            </StyledRowContainer>
          </StyledListItemView>
        </TouchableHighlight>
      </SwipeRow>
    );
  }
}

EventListItem.propTypes = {
  formattedRoundedPrice: PropTypes.string,
  timeDuration: PropTypes.number,
  startTimeInLocalTZ: PropTypes.string,
  name: PropTypes.string,
  instructorName: PropTypes.string,
  locationName: PropTypes.string,
  passid: PropTypes.number,
  valueBack: PropTypes.number,
  formattedValueBack: PropTypes.string,
  soldOut: PropTypes.bool,
};

const mapStateToProps = (state, props) => {
  const passValue = getUsersNextPassValue(state)(props.eventid);
  const valueBack = passValue ? Math.max(0, Decimal(passValue || 0).minus(props.price).toDecimalPlaces(2).toNumber()) : 0;
  return {
    passid: getUsersNextPassId(state)(props.eventid),
    valueBack,
    formattedValueBack: valueBack ? formatCurrency(valueBack, { precision: (valueBack % 1 && 2), code: props.currency }) : null,
  };
};
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(EventListItem);
