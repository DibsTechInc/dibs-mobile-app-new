import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { WHITE, DARK_TEXT_GREY } from '../../../constants';
import Config from '../../../../config.json';
import {
  getScheduleEvents,
  getEventsAreLoading,
  getNumberOfEventsOnCurrentDate,
  getScheduleCurrentDateIsToday,
  getScheduleCurrentDateIsAfterInterval,
} from '../../../selectors';
import DibsLoader from '../../shared/DibsLoader';
import { NormalText } from '../../styled';
import EventListItem from './EventListItem';

const ScrollContainer = styled.ScrollView`
  background: ${WHITE};
`;

const ContainerWithMargin = styled.View`
  align-items: center;
  margin-top: 25%;
  width: 100%;
`;

const NoEventsText = NormalText.extend`
  text-align: center;
  color: ${DARK_TEXT_GREY};
  font-size: 14;
  width: 75%;
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
      <ScrollContainer>
        {this.props.isLoading && !this.props.events.length ? (
          <ContainerWithMargin>
            <DibsLoader dotColor={Config.STUDIO_COLOR} />
          </ContainerWithMargin>
        ) : null}
        {!this.props.isLoading && !this.props.events.length && (
          <ContainerWithMargin>
            <NoEventsText>
              {this.getNoEventsText()}
            </NoEventsText>
          </ContainerWithMargin>
        )}
        {this.props.events.map(event => (
          <EventListItem key={event.eventid} {...event} />
        ))}
      </ScrollContainer>
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
