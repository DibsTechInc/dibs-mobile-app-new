import { connect } from 'react-redux';

import { UpcomingEventSlider } from '../shared';
import { getMostRecentUpcomingSliderEvents, getDetailedMostRecentUpcomingEvents } from '../../selectors';

const mapStateToProps = state => ({
  sliderEvents: getMostRecentUpcomingSliderEvents(state),
  detailedEvents: getDetailedMostRecentUpcomingEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEventSlider);
