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

import CalendarStrip from '../CalendarStrip';
import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData } from '../../actions/EventActions';
import { requestStudioData } from '../../actions/StudioActions';
import { setCurrentDate } from '../../actions/CurrentDateActions';
import { getEventsOnCurrentDate, getEventsLoading } from '../../selectors/EventsSelectors';
import { getStudioDibsConfig } from '../../selectors/StudioSelectors';

const StyledView = styled.View`
  padding-top: 65px;
  height: 100%;
  background-color: ${props => props.studioColor};
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

  componentDidUpdate(previousProps) {
    if (!(previousProps.currentDate.isSame(this.props.currentDate))) {
      this.props.requestEventData();
    }
  }

  handleDateSelected(selectedDate) {
    this.props.setCurrentDate(selectedDate);
  }


  render() {
    const configsNotLoaded = _.isEmpty(this.props.studioConfig);

    if (configsNotLoaded) {
      return null;
    }

    const studioColor = `#${this.props.studioConfig.color}`;

    return (
      <StyledView studioColor={studioColor}>
        <CalendarStrip
            calendarAnimation={{type: 'parallel', duration: 600}} // animation when switching weeks
            selection={'background'} // type of selection circle
            selectionAnimation={{duration: 300, borderWidth: 1}} // animation when selecting a date
            style={{paddingTop: 20, paddingBottom: 10}}
            calendarColor={studioColor} // main background color
            highlightColor={'#f4f4f4'} // color of the selection circle
            iconContainer={{ flex: 0.1 }}
            onDateSelected={this.handleDateSelected}
            dateNumberStyle={{color: 'white'}}
            dateNameStyle={{ color: 'white' }}
            calendarHeaderStyle={{ color: 'white'}}
            borderHighlightColor={'white'}
            highlightDateNameStyle={{ color: studioColor }}
            highlightDateNumberStyle={{ color: studioColor }}
        />
          {this.props.isLoading ?
            <StyledActivityIndicator size='large'/> :
            <SchedulePageEvents
              studioColor={studioColor}
              listings={this.props.events}
            />
          }
      </StyledView>
    );
  }
}

SchedulePage.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape()),
  studioConfig: PropTypes.shape(),
  currentDate: PropTypes.shape(),
  requestEventData: PropTypes.func,
  requestStudioDate: PropTypes.func,
  setCurrentDate: PropTypes.func,
  isLoading: PropTypes.bool,
}

const mapStateToProps = state => ({
  events: getEventsOnCurrentDate(state),
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

