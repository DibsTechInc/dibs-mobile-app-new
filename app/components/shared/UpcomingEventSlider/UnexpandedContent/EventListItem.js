import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, Alert } from 'react-native';
import { promisify } from 'bluebird';
import { connect } from 'react-redux';

import Config from '../../../../../config.json';
import { SOFT_GREY, DARK_TEXT_GREY } from '../../../../constants';
import { dropUserFromEvent } from '../../../../actions';
import { getDroppingUpcomingEvent } from '../../../../selectors/index';
import { SpaceBetweenRow, HeavyText, NormalText } from '../../../styled';
import { MaterialButton, DibsLoader } from '../../';

const Container = SpaceBetweenRow.extend`
  align-items: center;
  border-bottom-width: 1;
  border-color: ${SOFT_GREY};
  padding-horizontal: 15;
  padding-vertical: 10;
`;

const EventInfo = styled.View`
  flex-basis: 75%;
`;

const HeavyEventText = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 14;
`;

const EventText = NormalText.extend`
  color: ${DARK_TEXT_GREY};
`;

/**
 * @class SliderEventListItem
 * @extends {React.PureComponent}
 */
class SliderEventListItem extends React.PureComponent {
  /**
   * @constructor
   * @constructs SliderEventListItem
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.startDropClass = this.startDropClass.bind(this);
    this.dropClass = this.dropClass.bind(this);
  }
  /**
   * @returns {undefined}
   */
  startDropClass() {
    Alert.alert(
      'Are you sure?',
      `Do you want to drop ${this.props.name}?`,
      [
        { text: 'Yes', onPress: this.dropClass },
        { text: 'No', onPress: () => { } },
      ]
    );
  }
  /**
   * @returns {undefined}
   */
  async dropClass() {
    try {
      await promisify(this.props.dropUserFromEvent)(this.props.eventid);
      Alert.alert('Success!', `You were dropped from ${this.props.name}`);
    } catch (err) {
      Alert.alert('Uh oh!', err.message);
    }
  }
  /**
   * render
   * @returns {JSX.Element} XML
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
              {this.props.formattedStartTime} @ {this.props.locationName}
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
        {this.props.isDropping ? (
          <DibsLoader width={70} maxDotRadius={8} dotColor={Config.STUDIO_COLOR} />
        ) : (
          <MaterialButton
            text="Drop"
            style={{ height: 40, width: 70 }}
            onPress={this.startDropClass}
            fontSize={14}
          />
        )}
      </Container>
    );
  }
}

SliderEventListItem.propTypes = {
  shortDayOfWeek: PropTypes.string.isRequired,
  shortEventDate: PropTypes.string.isRequired,
  formattedStartTime: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  instructorName: PropTypes.string.isRequired,
  eventid: PropTypes.number.isRequired,
  isDropping: PropTypes.bool.isRequired,
  dropUserFromEvent: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  isDropping: getDroppingUpcomingEvent(state),
});
const mapDispatchToProps = { dropUserFromEvent };

export default connect(mapStateToProps, mapDispatchToProps)(SliderEventListItem);
