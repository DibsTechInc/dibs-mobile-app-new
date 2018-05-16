import { connect } from 'react-redux';

import { UpcomingEventSlider } from '../shared';
import { getUpcomingSliderEventsOnCurrentDate } from '../../selectors';

const mapStateToProps = state => ({
  events: getUpcomingSliderEventsOnCurrentDate(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEventSlider);
