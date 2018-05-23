import { connect } from 'react-redux';

import { UpcomingEventSlider } from '../shared';
import { getDetailedUpcomingEventsOnCurrentDay } from '../../selectors';

const mapStateToProps = state => ({
  events: getDetailedUpcomingEventsOnCurrentDay(state),
});

export default connect(mapStateToProps)(UpcomingEventSlider);
