import { connect } from 'react-redux';

import { UpcomingEventSlider } from '../shared';
import { getUpcomingSliderEventsOnCurrentDate, getDetailedUpcomingEventsOnCurrentDay } from '../../selectors';

const mapStateToProps = state => ({
  sliderEvents: getUpcomingSliderEventsOnCurrentDate(state),
  detailedEvents: getDetailedUpcomingEventsOnCurrentDay(state),
});

export default connect(mapStateToProps)(UpcomingEventSlider);
