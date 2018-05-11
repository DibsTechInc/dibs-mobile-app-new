import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FadeInView, UpcomingClasses } from '../shared';
import { getConfirmedTransactionsByEvent } from '../../selectors';

class ReceiptPage extends Component {
  render() {
    // const confirmedPurchases = this.props.navigation.state && this.props.navigation.state.params.confirmedPurchases;

    return (
      <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
        <UpcomingClasses confirmedPurchases={this.props.purchasedTransactions} />
      </FadeInView>
    );
  }
}

ReceiptPage.propTypes = {
  navigation: PropTypes.shape(),
};

ReceiptPage.propTypes = {
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
  purchasedTransactions: getConfirmedTransactionsByEvent(state),
});

export default connect(mapStateToProps)(ReceiptPage);
