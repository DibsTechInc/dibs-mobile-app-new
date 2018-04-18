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
  padding: 10px;
  margin-top: 65px;
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
    const stylesNotLoaded = _.isEmpty(this.props.studioConfig);

    if (stylesNotLoaded) {
      return null;
    }

    const studioColor = `#${this.props.studioConfig.color}`;
    // const disabledColor = ``

    return (
      <StyledView>
        <CalendarStrip
            calendarAnimation={{type: 'parallel', duration: 600}} // animation when switching weeks
            selection={'background'} // type of selection circle
            selectionAnimation={{duration: 300, borderWidth: 1}} // animation when selecting a date
            style={{paddingTop: 20, paddingBottom: 10}}
            // calendarHeaderStyle={{color: 'white'}}
            calendarColor={studioColor} // main background color
            highlightColor={'#f4f4f4'} // color of the selection circle
            // dateNumberStyle={{color: '#f4f4f4'}}
            // dateNameStyle={{color: '#f4f4f4'}}
            // highlightDateNumberStyle={{color: 'yellow'}}
            // highlightDateNameStyle={{color: 'yellow'}}
            // borderHighlightColor={'#fff'}
            iconContainer={{flex: 0.1}}
            onDateSelected={this.handleDateSelected}
        />
          {this.props.isLoading ? <ActivityIndicator size='large'/> : <SchedulePageEvents listings={this.props.events} />}
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

