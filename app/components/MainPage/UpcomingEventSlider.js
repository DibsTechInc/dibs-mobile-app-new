import { connect } from 'react-redux';

import { UpcomingEventSlider } from '../shared';
import { getDetailedMostRecentUpcomingEvents } from '../../selectors';

const mapStateToProps = state => ({
  detailedEvents: getDetailedMostRecentUpcomingEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEventSlider);
