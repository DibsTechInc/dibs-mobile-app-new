import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import Swiper from 'react-native-swiper';

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
      <ScrollView style={{ flex: 1, marginBottom: 20, marginTop: this.props.forReceiptPage ? 20 : 0 }}>
        <Swiper loop={false}>
          {this.props.events.map(event => (
            <UpcomingClass
              key={event.eventid}
              forReceiptPage={this.props.forReceiptPage}
              {...event}
            />
          ))}
        </Swiper>
      </ScrollView>
    );
  }
}

UpcomingClasses.defaultProps = { forReceiptPage: true };

UpcomingClasses.propTypes = {
  forReceiptPage: PropTypes.bool,
  events: PropTypes.arrayOf(PropTypes.shape()),
};

export default UpcomingClasses;
