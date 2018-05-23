import React from 'react';

import Config from '../../../config.json';
import { FadeInView } from '../shared';
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
        <Header title="My Classes" />
        <Calendar />
        <UpcomingEventSlider />
      </FadeInView>
    );
  }
}

export default UpcomingClassesPage;
