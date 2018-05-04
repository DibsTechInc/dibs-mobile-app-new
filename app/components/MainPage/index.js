
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import CalendarPage from './CalendarPage';
import { syncUserEvents } from '../../actions';
import Header from '../Header';
import * as Colors from '../../theme/colors';
import CartModal from '../CartPage';

import FadeInView from '../shared/FadeInView';

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
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.syncUserEvents();
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView style={{ backgroundColor: '#fff' }}>
        <Header navigation={this.props.navigation} iconColor={Colors.PRIMARY} backgroundColor={'#fff'} />
        <CalendarPage />
        <StyledTempComponent />
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
};

export default connect(null, mapDispatchToProps)(MainPage);
