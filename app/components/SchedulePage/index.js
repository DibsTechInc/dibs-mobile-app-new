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
import Config from '../../../config.json';

import CalendarStrip from '../CalendarStrip';
import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData, requestStudioData } from '../../actions';
import {
  setCurrentDate,
  getEventsLoading,
  getStudioDibsConfig,
  getStudioData,
} from '../../selectors';

const StyledView = styled.View`
  height: 100%;
`;

const StyledActivityIndicator = styled.ActivityIndicator`
  margin-top: 50%;
`;

class SchedulePage extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.studio.id) this.props.requestEventData();
  }

  componentWillReceiveProps(props) {
    if (!this.props.studio.id && props.studio.id) this.props.requestEventData();
  }

  componentDidUpdate(props) {
    if (props.currentDate.toISOString() !== this.props.currentDate.toISOString()) {
      this.props.requestEventData();
    }
  }


  render() {
    return (
      <StyledView>
        <CalendarStrip
          calendarAnimation={{ type: 'parallel', duration: 600 }} // animation when switching weeks
          selection="background" // type of selection circle
          selectionAnimation={{ duration: 300, borderWidth: 1 }} // animation when selecting a date
          style={{ paddingTop: 20, paddingBottom: 10 }}
          calendarColor={Config.STUDIO_COLOR} // main background color
          highlightColor="#f4f4f4" // color of the selection circle
          iconContainer={{ flex: 0.1 }}
          dateNumberStyle={{ color: 'white' }}
          dateNameStyle={{ color: 'white' }}
          calendarHeaderStyle={{ color: 'white' }}
          borderHighlightColor="white"
          highlightDateNameStyle={{ color: Config.STUDIO_COLOR }}
          highlightDateNumberStyle={{ color: Config.STUDIO_COLOR }}
        />
        {(this.props.isLoading ?
          <StyledActivityIndicator size="large" />
          : <SchedulePageEvents studioColor={Config.STUDIO_COLOR} />
        )}
      </StyledView>
    );
  }
}

SchedulePage.propTypes = {
  requestEventData: PropTypes.func,
  isLoading: PropTypes.bool,
  currentDate: PropTypes.shape(),
  studio: PropTypes.shape(),
};

const mapStateToProps = state => ({
  isLoading: getEventsLoading(state),
  studioConfig: getStudioDibsConfig(state),
  currentDate: state.currentDate,
  studio: getStudioData(state),
});

const mapDispatchToProps = {
  requestEventData,
  requestStudioData,
  setCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

