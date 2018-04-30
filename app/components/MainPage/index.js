
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Button,
} from 'react-native';
import styled from 'styled-components';
import { lightenDarkenColor } from '../../helpers';
import CalendarPage from './CalendarPage';
import { SCHEDULE_ROUTE, PROFILE_ROUTE } from '../../constants/RouteConstants/index';
import { logOutUser, requestStudioData } from '../../actions';
import { getStudioIsLoading } from '../../selectors';

const StyledView = styled.View`
  flex: 1;
  background-color: ${lightenDarkenColor('#8dc63f', 30)};
`;

const StyledInnerView = styled.View`
  margin-top: 10;
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
    this.handleOnPressSchedule = this.handleOnPress.bind(this, SCHEDULE_ROUTE);
    this.handleOnPressProfile = this.handleOnPress.bind(this, PROFILE_ROUTE);
    this.handleLogout = this.handleLogout.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.requestStudioData();
  }
  /**
   * @param {string} route to navigate to
   * @returns {undefined}
   */
  handleOnPress(route) {
    this.props.navigation.navigate(route);
  }
  /**
   * @returns {undefined}
   */
  handleLogout() {
    this.props.logOutUser();
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView>
        <CalendarPage />
        <StyledInnerView>
          {!this.props.studioIsLoading && <Button onPress={this.handleOnPressSchedule} title="Buy class" color="black" />}
          <Button onPress={this.handleOnPressProfile} title="Profile Settings" color="black" />
          <Button onPress={this.handleLogout} title="Logout" color="black" />
        </StyledInnerView>
      </StyledView>
    );
  }
}

MainPage.propTypes = {
  navigation: PropTypes.shape(),
  studioIsLoading: PropTypes.bool,
  requestStudioData: PropTypes.func,
  logOutUser: PropTypes.func,
};

MainPage.navigationOptions = {
  gesturesEnabled: false,
};

const mapStateToProps = state => ({
  studioIsLoading: getStudioIsLoading(state),
});
const mapDispatchToProps = {
  logOutUser,
  requestStudioData,
};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
