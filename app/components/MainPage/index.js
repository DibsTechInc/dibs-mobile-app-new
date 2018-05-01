
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';

import CalendarPage from './CalendarPage';
import { SCHEDULE_ROUTE, PROFILE_ROUTE } from '../../constants/RouteConstants/index';
import { logOutUser, requestStudioData, syncUserEvents } from '../../actions';
import { getStudioIsLoading } from '../../selectors';
import Header from '../Header';
import * as Colors from '../../theme/colors';

const StyledView = styled.View`
  flex: 1;
  background-color: #fff;
`;

const StyledTempComponent = styled.View`
  background-color: ${Colors.PRIMARY}
  height: 100%;
`;

/**
 * @class MainPage
 * @extends {Component}
 */
class MainPage extends Component {
  /**
   * @constructor
   * @constructs MainPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.handleOnPressSchedule = this.handleOnPress.bind(this, SCHEDULE_ROUTE);
    this.handleOnPressProfile = this.handleOnPress.bind(this, PROFILE_ROUTE);
    this.handleLogout = this.handleLogout.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.getData();
  }
  /**
   * @returns {undefined}
   */
  async getData() {
    if (!this.props.hasStudioData) await new Promise(res => this.props.requestStudioData(res));
    this.props.syncUserEvents();
  }
  /**
   * @param {string} route to navigate to
   * @returns {undefined}
   */
  handleOnPress(route) {
    this.props.navigation.navigate(route);
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView>
        <Header navigation={this.props.navigation} iconColor={Colors.PRIMARY} backgroundColor={'#fff'} />
        <CalendarPage />
        <StyledTempComponent />
      </StyledView>
    );
  }
}

MainPage.propTypes = {
  navigation: PropTypes.shape(),
  hasStudioData: PropTypes.bool,
  requestStudioData: PropTypes.func,
  syncUserEvents: PropTypes.func,
  logOutUser: PropTypes.func,
};

MainPage.navigationOptions = {
  gesturesEnabled: false,
};

const mapStateToProps = state => ({
  studioIsLoading: getStudioIsLoading(state),
  hasStudioData: Boolean(state.studio.data),
});

const mapDispatchToProps = {
  logOutUser,
  requestStudioData,
  syncUserEvents,
};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
