import React from 'react';
import PropTypes from 'prop-types';

import { FadeInView, UpcomingEvents } from '../';

/**
 * @class ExpandedContent
 * @extends {React.PureComponent}
 */
class ExpandedContent extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
        <UpcomingEvents events={this.props.events} />
      </FadeInView>
    );
  }
}

ExpandedContent.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape()),
};

export default ExpandedContent;
