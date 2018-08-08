import React from 'react';
import PropTypes from 'prop-types';

import UpcomingEvent from '../shared/PaginatedSlider/UpcomingEvent';

/**
 * @class ClassDetail
 * @extends {React.PureComponent}
 */
class ClassDetail extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const { params } = this.props.navigation.state;
    return (
      <UpcomingEvent
        hasHeader
        {...params}
      />
    );
  }
}

ClassDetail.propTypes = {
  navigation: PropTypes.shape(),
};

export default ClassDetail;
