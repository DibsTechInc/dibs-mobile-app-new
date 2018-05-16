import { connect } from 'react-redux';

import { getStudioCurrency } from '../../selectors';
import UpcomingClasses from '../shared/UpcomingClasses';

const mapStateToProps = state => ({
  currency: getStudioCurrency(state),
});

export default connect(mapStateToProps)(UpcomingClasses);
