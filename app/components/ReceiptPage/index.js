import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getDetailedConfirmationEvents, getDetailedConfirmationPackages, getDetailedConfirmationCredits } from '../../selectors';
import { clearConfirmation } from '../../actions';
import { PaginatedSlider, FadeInView } from '../shared';
import Header from '../Header';

/**
 * @class ReceiptPage
 * @extends {Component}
 */
class ReceiptPage extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  componentWillUnmount() {
    this.props.clearConfirmation();
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView>
        <Header title="Order Summary" />
        <PaginatedSlider
          forReceiptPage
          credits={this.props.credits}
          packages={this.props.packages}
          events={this.props.events}
        />
      </FadeInView>
    );
  }
}

ReceiptPage.propTypes = {
  credits: PropTypes.arrayOf(PropTypes.shape()),
  packages: PropTypes.arrayOf(PropTypes.shape()),
  events: PropTypes.arrayOf(PropTypes.shape()),
  clearConfirmation: PropTypes.func,
};

const mapStateToProps = state => ({
  credits: getDetailedConfirmationCredits(state),
  packages: getDetailedConfirmationPackages(state),
  events: getDetailedConfirmationEvents(state),
});

const mapDispatchToProps = {
  clearConfirmation,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReceiptPage);
