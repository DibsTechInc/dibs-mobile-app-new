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
      <ScrollView style={{ flex: 1, marginBottom: 20, marginTop: 20 }}>
        <Swiper loop={false}>
          {this.props.confirmedPurchases.map(event =>
            <UpcomingClass {...event} key={event.stripe_charge_id} />
          )}
        </Swiper>
      </ScrollView>
    );
  }
}

UpcomingClasses.propTypes = {
  confirmedPurchases: PropTypes.arrayOf(PropTypes.shape()),
};

export default UpcomingClasses;
