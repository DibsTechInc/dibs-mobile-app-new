import { connect } from 'react-redux';

import { UpcomingEventSlider } from '../shared';
import { getMostRecentUpcomingSliderEvents } from '../../selectors';

const mapStateToProps = state => ({
  events: getMostRecentUpcomingSliderEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(UpcomingEventSlider);
