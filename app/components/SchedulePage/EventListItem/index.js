import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { WHITE, TEXT_GREY, LIGHT_GREY } from '../../../constants';

const StyledListItemView = styled.View`
  align-items: center;
  background-color: ${WHITE};
  justify-content: center;
  border-bottom-width: 1;
  border-color: ${LIGHT_GREY};
`;

const StyledRowContainer = styled.View`
  flex-direction: row;
  padding: 5px;
  justify-content: space-between;
  align-items: center;
`;

const StyledColumnContainer = styled.View`
  flex-direction: column;
  padding: 10px;
  justify-content: center;
  align-items: center;
  flex-basis: 25%;
`;

const StyledTitle = styled.Text`
  font-size: 10px;
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
  color: ${TEXT_GREY};
`;

/**
 * @class SchedulePageEventListItem
 * @extends PureComponent
 */
class SchedulePageEventListItem extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
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
          <StyledColumnContainer>
            <StyledPrice>
              {this.props.formattedRoundedPrice}
            </StyledPrice>
          </StyledColumnContainer>
        </StyledRowContainer>
      </StyledListItemView>
    );
  }
}

SchedulePageEventListItem.propTypes = {
  formattedRoundedPrice: PropTypes.string,
  timeDuration: PropTypes.number,
  startTimeInLocalTZ: PropTypes.string,
  name: PropTypes.string,
  instructorName: PropTypes.string,
  locationName: PropTypes.string,
};

export default SchedulePageEventListItem;
