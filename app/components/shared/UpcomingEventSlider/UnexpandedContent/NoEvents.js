import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';

import { getUpcomingEventsNaturalCurrrentDate } from '../../../../selectors';
import { setScheduleCurrentDate } from '../../../../actions';
import { DARK_TEXT_GREY, SCHEDULE_ROUTE } from '../../../../constants';
import { MaterialButton } from '../../../shared';

const Container = styled.View`
  align-items: center;
`;

const NoEventsText = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-family: 'flex-font';
  font-size: 14;
  margin-bottom: 20;
  margin-top: 10;
  text-align: center;
`;

// This component is only used in UpcomingClasses page
// if you need it elsewhere make sure to do proper
// set up with Redux

/**
 * @class NoEvents
 * @extends {React.PureComponent}
 */
class NoEvents extends React.PureComponent {
  /**
   * @constructor
   * @constructs NoEvents
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.onPress = this.onPress.bind(this);
  }
  /**
   * @returns {undefined}
   */
  onPress() {
    this.props.setScheduleCurrentDate(this.props.selectedDate);
    this.props.navigation.navigate(SCHEDULE_ROUTE);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container>
        <NoEventsText>
          No classes on {this.props.naturalDate}...
        </NoEventsText>
        <MaterialButton
          style={{ width: 120, height: 40 }}
          text="Book Now"
          onPress={this.onPress}
        />
      </Container>
    );
  }
}

NoEvents.propTypes = {
  navigation: PropTypes.shape().isRequired,
  naturalDate: PropTypes.string.isRequired,
  selectedDate: PropTypes.shape().isRequired,
  setScheduleCurrentDate: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  naturalDate: getUpcomingEventsNaturalCurrrentDate(state),
  selectedDate: state.upcomingEvents.currentDate,
});
const mapDispatchToProps = { setScheduleCurrentDate };

export default compose(
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps)
)(NoEvents);
