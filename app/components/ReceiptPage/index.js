import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FadeInView } from '../shared';
import { getConfirmedTransactionsByEvent } from '../../selectors';
import { clearConfirmation } from '../../actions';
import UpcomingClasses from '../shared/UpcomingClasses';

/**
 * @class ReceiptPage
 * @extends {Component}
 */
class ReceiptPage extends Component {
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
      <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
        <UpcomingClasses confirmedPurchases={this.props.purchasedTransactions} />
      </FadeInView>
    );
  }
}

ReceiptPage.propTypes = {
  purchasedTransactions: PropTypes.arrayOf(PropTypes.shape()),
  clearConfirmation: PropTypes.func,
};

const mapStateToProps = state => ({
  purchasedTransactions: getConfirmedTransactionsByEvent(state),
});

const mapDispatchToProps = {
  clearConfirmation,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReceiptPage);
