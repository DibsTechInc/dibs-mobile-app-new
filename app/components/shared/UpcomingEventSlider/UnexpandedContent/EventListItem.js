import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View } from 'react-native';

import { LIGHT_GREY, DARK_TEXT_GREY } from '../../../../constants';
import { SpaceBetweenRow, HeavyText } from '../../../styled';
import MaterialButton from '../../MaterialButton';

const Container = SpaceBetweenRow.extend`
  align-items: center;
  border-bottom-width: 1;
  border-color: ${LIGHT_GREY};
  padding-horizontal: 15;
  padding-vertical: 10;
  width: 100%;
`;

const EventInfo = styled.View`
  flex-basis: 75%;
`;

const HeavyEventText = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 12;
`;

const EventText = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-family: flex-font;
  font-size: 12;
`;

/**
 * @class SliderEventListItem
 * @extends {React.PureComponent}
 */
class SliderEventListItem extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container>
        <EventInfo>
          <View style={{ marginBottom: 10 }}>
            <HeavyEventText>
              {this.props.shortDayOfWeek} {this.props.shortEventDate}
            </HeavyEventText>
            <EventText numberOfLines={1}>
              {this.props.formattedStartTime} - {this.props.formattedEndTime} @ {this.props.locationName}
            </EventText>
          </View>
          <View>
            <HeavyEventText numberOfLines={1}>
              {this.props.name}
            </HeavyEventText>
            <EventText numberOfLines={1}>
              {this.props.instructorName}
            </EventText>
          </View>
        </EventInfo>
        <MaterialButton
          text="Drop"
          style={{ height: 40, width: 70 }}
          onPress={() => {}}
        />
      </Container>
    );
  }
}

SliderEventListItem.propTypes = {
  shortDayOfWeek: PropTypes.string.isRequired,
  shortEventDate: PropTypes.string.isRequired,
  formattedStartTime: PropTypes.string.isRequired,
  formattedEndTime: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
};

export default SliderEventListItem;
