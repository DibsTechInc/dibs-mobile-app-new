import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { View } from 'react-native';

import { DARK_TEXT_GREY, SOFT_GREY } from '../../../constants';
import Config from '../../../../config.json';
import {
  getScheduleEvents,
  getEventsAreLoading,
  getNumberOfEventsOnCurrentDate,
  getScheduleCurrentDateIsToday,
  getScheduleCurrentDateIsAfterInterval,
} from '../../../selectors';
import LinearLoader from '../../shared/LinearLoader';
import { NormalText } from '../../styled';
import EventListItem from '../../shared/EventListItem';

const ScrollContainer = styled.ScrollView`
  background: ${SOFT_GREY};
`;

const ContainerWithMargin = styled.View`
  align-items: center;
  margin-top: 15%;
  width: 100%;
`;

const NoEventsText = styled(NormalText)`
  text-align: center;
  color: ${DARK_TEXT_GREY};
  font-size: 16;
  width: 75%;
`;

const IPhoneXPadding = styled.View`
  background: ${SOFT_GREY};
  height: ${Number(isIphoneX()) * 25};
  width: 100%;
`;

/**
 * @class EventList
 * @extends {React.PureComponent}
 */
class EventList extends React.PureComponent {
  /**
   * @returns {string} displays when there are no classes on the schedule
   */
  getNoEventsText() {
    switch (true) {
      case this.props.currentDateIsToday
        && this.props.hasEventsOnCurrentDate:
        return 'Sorry, there are no more classes available today.';

      case this.props.currentDateIsAfterInterval:
        return 'Classes are not available yet on this date. Please check again later.';

      default:
        return 'No classes available on this date.';
    }
  }
  /**
   * render
   * @returns {JSX.Element} XML
   */
  render() {
    return (
      <View style={{ flex: 1 }}>
        <ScrollContainer>
          {this.props.isLoading && !this.props.events.length ? (
            <ContainerWithMargin>
              <LinearLoader color={Config.STUDIO_COLOR} />
            </ContainerWithMargin>
          ) : null}
          {!this.props.isLoading && !this.props.events.length ? (
            <ContainerWithMargin>
              <NoEventsText>
                {this.getNoEventsText()}
              </NoEventsText>
            </ContainerWithMargin>
          ) : undefined}
          {this.props.events.map(event => (
            <EventListItem
              key={event.eventid}
              cartItem={event}
              {...event}
            />
          ))}
        </ScrollContainer>
        <IPhoneXPadding />
      </View>
    );
  }
}

EventList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  events: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  hasEventsOnCurrentDate: PropTypes.bool.isRequired,
  currentDateIsToday: PropTypes.bool.isRequired,
  currentDateIsAfterInterval: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  events: getScheduleEvents(state),
  isLoading: getEventsAreLoading(state),
  hasEventsOnCurrentDate: Boolean(getNumberOfEventsOnCurrentDate(state)),
  currentDateIsToday: getScheduleCurrentDateIsToday(state),
  currentDateIsAfterInterval: getScheduleCurrentDateIsAfterInterval(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(EventList);
