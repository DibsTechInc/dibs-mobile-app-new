import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Config from '../../../config.json';
import { requestEventData, requestStudioData } from '../../actions';
import {
  setCurrentDate,
  getStudioDibsConfig,
  getEventsAreLoading,
} from '../../selectors';
import Header from '../Header';
import { WHITE, SOFT_GREY, BLACK } from '../../constants';
import FadeInView from '../shared/FadeInView';
import CalendarStrip from './CalendarStrip';
import EventList from './EventList';

const Shadow = styled.View`
  background: ${SOFT_GREY};
  elevation: 3;
  height: 1;
  shadow-color: ${BLACK};
  shadow-opacity: 1;
  shadow-radius: 4;
  width: 100%;
  z-index: 3;
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
      <FadeInView style={{ height: '100%', backgroundColor: Config.STUDIO_COLOR }}>
        <Header
          navigation={this.props.navigation}
          iconColor={WHITE}
          backgroundColor={Config.STUDIO_COLOR}
        />
        <CalendarStrip />
        <Shadow />
        <EventList />
      </FadeInView>
    );
  }
}

SchedulePage.propTypes = {
  requestEventData: PropTypes.func,
  currentDate: PropTypes.shape(),
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
  isLoading: getEventsAreLoading(state),
  studioConfig: getStudioDibsConfig(state),
  currentDate: state.currentDate,
});

const mapDispatchToProps = {
  requestEventData,
  requestStudioData,
  setCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchedulePage);

