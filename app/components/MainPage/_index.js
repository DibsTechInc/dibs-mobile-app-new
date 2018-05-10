
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
} from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components';
import CalendarPage from './CalendarPage';
import Header from '../Header';
import { WHITE } from '../../constants';
import CartModal from '../CartPage';

import FadeInView from '../shared/FadeInView';
import { syncUserEvents, logOutUser } from '../../actions';

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
        <Header iconColor={WHITE} backgroundColor={Config.STUIO_COLOR} />
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
