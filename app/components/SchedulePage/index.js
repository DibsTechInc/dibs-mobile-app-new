import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ActivityIndicator,
  Image,
} from 'react-native';
import _ from 'lodash';
import styled from 'styled-components';
import moment from 'moment';

import CalendarStrip from '../CalendarStrip';
import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData } from '../../actions/EventActions';
import { requestStudioData } from '../../actions/StudioActions';
import { setCurrentDate } from '../../actions/CurrentDateActions';
import { getEventsOnCurrentDate, getEventsLoading } from '../../selectors/EventsSelectors';
import { getStudioDibsConfig } from '../../selectors/StudioSelectors';

const StyledView = styled.View`
  height: 100%;
`;

const StyledActivityIndicator = styled.ActivityIndicator`
  margin-top: 50%;
`;

class SchedulePage extends Component {
  constructor(props) {
    super(props);

    this.handleDateSelected = this.handleDateSelected.bind(this);
  };

  componentDidMount() {
    this.props.requestStudioData(() => {
      this.props.requestEventData();
    });
  }

  componentDidUpdate(props) {
    if (!moment(props.currentDate).isSame(moment(this.props.currentDate))) {
      this.props.requestEventData();
    }
  }

  handleDateSelected(selectedDate) {
    this.props.setCurrentDate(selectedDate);
  }


  render() {
    if (_.isEmpty(this.props.studioConfig)) {
      return null;
    }
    const STUDIO_COLOR = `#${this.props.studioConfig.color}`;
    return (
      <StyledView>
        <CalendarStrip
          calendarAnimation={{ type: 'parallel', duration: 600 }} // animation when switching weeks
          selection="background" // type of selection circle
          selectionAnimation={{ duration: 300, borderWidth: 1 }} // animation when selecting a date
          style={{ paddingTop: 20, paddingBottom: 10 }}
          calendarColor={STUDIO_COLOR} // main background color
          highlightColor={'#f4f4f4'} // color of the selection circle
          iconContainer={{ flex: 0.1 }}
          onDateSelected={this.handleDateSelected}
          dateNumberStyle={{ color: 'white' }}
          dateNameStyle={{ color: 'white' }}
          calendarHeaderStyle={{ color: 'white' }}
          borderHighlightColor="white"
          highlightDateNameStyle={{ color: STUDIO_COLOR }}
          highlightDateNumberStyle={{ color: STUDIO_COLOR }}
        />
        {/* this.props.isLoading ?
            <StyledActivityIndicator size='large' /> :
            <SchedulePageEvents
              studioColor={studioColor}
              listings={this.props.events}
            />
          */}
      </StyledView>
    );
  }
}

SchedulePage.propTypes = {
  // events: PropTypes.arrayOf(PropTypes.shape()),
  studioConfig: PropTypes.shape(),
  currentDate: PropTypes.string,
  requestEventData: PropTypes.func,
  requestStudioData: PropTypes.func,
  setCurrentDate: PropTypes.func,
  isLoading: PropTypes.bool,
};

const mapStateToProps = state => ({
  studio: state.studio,
  // events: getEventsOnCurrentDate(state),
  isLoading: getEventsLoading(state),
  studioConfig: getStudioDibsConfig(state),
  currentDate: state.currentDate,
});

const mapDispatchToProps = {
  requestEventData,
  requestStudioData,
  setCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

