import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Config from '../../../../config.json';
import { WHITE, HEIGHT } from '../../../constants';
import { setUpcomingEventSliderExpandedFalse } from '../../../actions';
import UpcomingEvent from './UpcomingEvent';
import PackageReceipt from './PackageReceipt';
import CreditReceipt from './CreditReceipt';

/**
 * @class UpcomingClasses
 * @extends {Component}
 */
class PaginatedSlider extends PureComponent {
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
      height: isIphoneX() ? 45 : 25,
      paddingVertical: 5,
      paddingBottom: isIphoneX() ? 18 : 5,
      position: 'absolute',
      flex: 0,
      top: HEIGHT - (isIphoneX() ? 140 : 105),
    };

    const items = this.props.credits.map(creditItem => (
      <CreditReceipt
        key={creditItem.id}
        {...creditItem}
      />
    ));
    items.push(...this.props.packages.map(pkgItem => (
      <PackageReceipt
        key={pkgItem.id}
        {...pkgItem}
      />
    )));
    items.push(...this.props.events.map(event => (
      <UpcomingEvent
        key={event.eventid}
        forReceiptPage={this.props.forReceiptPage}
        expanded={this.props.expanded}
        {...event}
      />
    )));

    return (
      <Swiper
        loop={false}
        containerStyle={containerStyle}
        paginationStyle={paginationStyle}
        activeDotStyle={{ backgroundColor: Config.STUDIO_COLOR }}
      >
        {items}
      </Swiper>
    );
  }
}

PaginatedSlider.defaultProps = {
  expanded: true,
  forReceiptPage: false,
  packages: [],
  credits: [],
};

PaginatedSlider.propTypes = {
  forReceiptPage: PropTypes.bool,
  events: PropTypes.arrayOf(PropTypes.shape()),
  expanded: PropTypes.bool.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
  packages: PropTypes.arrayOf(PropTypes.shape()),
  credits: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  expanded: state.animation.upcomingEventSliderExpanded,
});
const mapDispatchToProps = {
  setUpcomingEventSliderExpandedFalse,
};

export default connect(mapStateToProps, mapDispatchToProps)(PaginatedSlider);
