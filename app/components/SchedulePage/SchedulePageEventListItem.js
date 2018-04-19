import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import moment from 'moment';
import styled from 'styled-components';

const StyledListItemView = styled.View`
  align-items: center;
  background-color: #fff;
  justify-content: center;
  border-bottom-width: 1;
  border-color: #f4f4f4;
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
  font-size: 12px;
  color: #656565;
`;

const StyledPrice = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #656565;
`;

const StyledSeparator = styled.View`
  height: 1px;
  backgroundColor: #dddddd;
`;

class SchedulePageEventListItem extends PureComponent {
  render() {
    const item = this.props.item;
    const price = "$" + item.price;
    const startTime = moment(item.start_time).format('h:mm a');
    const end = moment.utc(item.end_time, "HH:mm");
    const start = moment.utc(item.start_time, "HH:mm");
    const d = moment.duration(end.diff(start));
    const duration = moment.utc(+d).format('mm') + " min";
  
    return (
      <StyledListItemView>
        <StyledRowContainer>
            <StyledColumnContainer>
              <StyledTitle>{startTime}</StyledTitle>
              <StyledTitle>{duration}</StyledTitle>
            </StyledColumnContainer>
            <StyledColumnContainer>
              <StyledTitle>{item.name}</StyledTitle>
              <StyledTitle>{item.instructor.name}</StyledTitle>
            </StyledColumnContainer>
            <StyledColumnContainer>
                <StyledTitle>{item.location.name}</StyledTitle>
            </StyledColumnContainer>
            <StyledColumnContainer>
                <StyledPrice>{price}</StyledPrice>
            </StyledColumnContainer>
        </StyledRowContainer>
        <StyledSeparator />
      </StyledListItemView>
    );
  }
}

SchedulePageEventListItem.propTypes = {
  item: PropTypes.shape(),
}

export default SchedulePageEventListItem;
