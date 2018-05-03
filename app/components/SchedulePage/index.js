import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';

import Config from '../../../config.json';
import CalendarStrip from './CalendarStrip';
import SchedulePageEvents from './SchedulePageEvents';
import { requestEventData, requestStudioData } from '../../actions';
import {
  setCurrentDate,
  getEventsLoading,
  getStudioDibsConfig,
} from '../../selectors';
import Header from '../Header';
import * as Colors from '../../theme/colors';
import FadeInView from '../shared/FadeInView';

const StyledActivityIndicator = styled.ActivityIndicator`
  margin-top: 50%;
`;

/**
 * @class SchedulePage
 * @extends Component
 */
class SchedulePage extends Component {
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.requestEventData();
  }
  /**
   * @param {object} props react props
   * @returns {undefined}
   */
  componentDidUpdate(props) {
    if (props.currentDate.toISOString() !== this.props.currentDate.toISOString()) {
      this.props.requestEventData();
    }
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ height: '100%', backgroundColor: Colors.PRIMARY }}>
        <Header navigation={this.props.navigation} iconColor={'#fff'} backgroundColor={Colors.PRIMARY} />
        <CalendarStrip
          // calendarAnimation={{ type: 'sequence', duration: 30 }}
          // selectionAnimation={{ duration: 300, borderWidth: 1 }}
          selection="background" // type of selection circle
          style={{ paddingBottom: 30 }}
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
          <StyledActivityIndicator size="large" color="#fff" />
          : <SchedulePageEvents studioColor={Config.STUDIO_COLOR} />
        )}
      </FadeInView>
    );
  }
}

SchedulePage.propTypes = {
  requestEventData: PropTypes.func,
  isLoading: PropTypes.bool,
  currentDate: PropTypes.shape(),
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
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

