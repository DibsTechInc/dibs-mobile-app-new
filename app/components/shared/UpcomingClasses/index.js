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
    const renderClasses = this.props.confirmedPurchases.map(c => <UpcomingClass class={c} key={c.stripe_charge_id} currency={this.props.currency} />);

    return (
      <ScrollView style={{ flex: 1, marginBottom: 20, marginTop: 20 }}>
        <Swiper loop={false}>
          {renderClasses}
        </Swiper>
      </ScrollView>
    );
  }
}

UpcomingClasses.propTypes = {
  confirmedPurchases: PropTypes.arrayOf(PropTypes.shape()),
  currency: PropTypes.string,
};

export default UpcomingClasses;
