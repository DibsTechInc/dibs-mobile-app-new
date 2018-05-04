
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components';
import CalendarPage from './CalendarPage';
import { syncUserEvents } from '../../actions';
import Header from '../Header';
import * as Colors from '../../theme/colors';
import CartModal from '../CartPage';

import FadeInView from '../shared/FadeInView';
import { logOutUser } from '../../actions';

const StyledTempComponent = styled.View`
  background-color: ${Colors.PRIMARY}
  height: 100%;
`;

/**
 * @class MainPage
 * @extends {Component}
 */
class MainPage extends Component {
  constructor() {
    super();

    this.handleLogout = this.handleLogout.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.syncUserEvents();
    this.props.navigation.popToTop();
  }

    /**
   * @returns {undefined}
   */
  async handleLogout() {
    await new Promise(res => this.props.logOutUser(res));
    this.props.navigation.navigate('Landing');
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ backgroundColor: '#fff' }}>
        <Header navigation={this.props.navigation} iconColor={Colors.PRIMARY} backgroundColor={'#fff'} />
        <CalendarPage />
        <StyledTempComponent>
          <Button onPress={this.handleLogout} title="Logout" color="black" />
        </StyledTempComponent>
        <CartModal isVisible />
      </FadeInView>
    );
  }
}

MainPage.propTypes = {
  navigation: PropTypes.shape(),
  syncUserEvents: PropTypes.func,
};

MainPage.navigationOptions = {
  gesturesEnabled: false,
};
const mapDispatchToProps = {
  syncUserEvents,
  logOutUser,
};

export default connect(null, mapDispatchToProps)(MainPage);
