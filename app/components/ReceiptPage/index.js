import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FadeInView } from '../shared';
import { getConfirmedTransactionsByEvent } from '../../selectors';
import UpcomingClasses from './UpcomingClasses';

/**
 * @class ReceiptPage
 * @extends {Component}
 */
class ReceiptPage extends Component {
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
};

const mapStateToProps = state => ({
  purchasedTransactions: getConfirmedTransactionsByEvent(state),
});

export default connect(mapStateToProps)(ReceiptPage);
