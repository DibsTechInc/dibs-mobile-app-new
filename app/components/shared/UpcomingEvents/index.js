import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Swiper from 'react-native-swiper';

import Config from '../../../../config.json';
import { WHITE, HEIGHT, DEFAULT_BG } from '../../../constants';
import UpcomingClass from './UpcomingClass';

/**
 * @class UpcomingClasses
 * @extends {Component}
 */
class UpcomingClasses extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <Swiper
        loop={false}
        containerStyle={{ flex: 0, height: HEIGHT - 100 }}
        paginationStyle={{
          backgroundColor: this.props.forReceiptPage ? DEFAULT_BG : WHITE,
          bottom: 0,
          paddingVertical: 5,
          position: 'absolute',
        }}
        activeDotStyle={{ backgroundColor: Config.STUDIO_COLOR }}
      >
        {this.props.events.map(event => (
          <UpcomingClass
            key={event.eventid}
            forReceiptPage={this.props.forReceiptPage}
            {...event}
          />
        ))}
      </Swiper>
    );
  }
}

UpcomingClasses.defaultProps = { forReceiptPage: true };

UpcomingClasses.propTypes = {
  forReceiptPage: PropTypes.bool,
  events: PropTypes.arrayOf(PropTypes.shape()),
};

export default UpcomingClasses;
