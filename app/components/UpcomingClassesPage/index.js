import React from 'react';
import PropTypes from 'prop-types';

import Config from '../../../config.json';
import { TRANSPARENT, WHITE } from '../../constants';
import { FadeInView, CustomStatusBar } from '../shared';
import Header from '../Header';
import UpcomingEventSlider from './UpcomingEventSlider';
import Calendar from './Calendar';

/**
 * @class UpcomingClassesPage
 * @extends {React.PureComponent}
 */
class UpcomingClassesPage extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView style={{ position: 'relative', backgroundColor: Config.STUDIO_COLOR }}>
        <CustomStatusBar backgroundColor={TRANSPARENT} barStyle="light-content" />
        <Header title="My Classes" />
        <Calendar />
        <UpcomingEventSlider isUpcomingClassesPage />
      </FadeInView>
    );
  }
}

export default UpcomingClassesPage;
