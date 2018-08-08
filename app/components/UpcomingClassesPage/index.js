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
   * @constructor
   * @constructs UpComingClassesPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.state = {
      showClassHistory: false,
    };

    this.toggleClassHistory = this.toggleClassHistory.bind(this);
  }
  /**
   * @returns {undefined}
   */
  toggleClassHistory() {
    this.setState({ showClassHistory: !this.state.showClassHistory });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView style={{ position: 'relative', backgroundColor: Config.STUDIO_COLOR }}>
        <Header title="Calendar" />
        <Calendar />
        <UpcomingEventSlider />
      </FadeInView>
    );
  }
}

export default UpcomingClassesPage;
