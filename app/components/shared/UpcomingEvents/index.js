import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Config from '../../../../config.json';
import { WHITE, HEIGHT } from '../../../constants';
import { setUpcomingEventSliderExpandedFalse } from '../../../actions';
import UpcomingEvent from './UpcomingEvent';

/**
 * @class UpcomingClasses
 * @extends {Component}
 */
class UpcomingEvents extends PureComponent {
  /**
   * @param {Object} props for component
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.expanded && !props.events.length) {
      this.props.setUpcomingEventSliderExpandedFalse();
    }
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const containerStyle = { flex: 1, height: HEIGHT };
    const paginationStyle = {
      backgroundColor: WHITE,
      height: 25,
      paddingVertical: 5,
      position: 'absolute',
      flex: 0,
      top: HEIGHT - (isIphoneX() ? 140 : 105),
    };

    return (
      <Swiper
        loop={false}
        containerStyle={containerStyle}
        paginationStyle={paginationStyle}
        activeDotStyle={{ backgroundColor: Config.STUDIO_COLOR }}
      >
        {this.props.events.map(event => (
          <UpcomingEvent
            key={event.eventid}
            forReceiptPage={this.props.forReceiptPage}
            expanded={this.props.expanded}
            {...event}
          />
        ))}
      </Swiper>
    );
  }
}

UpcomingEvents.defaultProps = { expanded: true };

UpcomingEvents.propTypes = {
  forReceiptPage: PropTypes.bool,
  events: PropTypes.arrayOf(PropTypes.shape()),
  expanded: PropTypes.bool.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  expanded: state.animation.upcomingEventSliderExpanded,
});
const mapDispatchToProps = {
  setUpcomingEventSliderExpandedFalse,
};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEvents);
