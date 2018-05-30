import React, { PureComponent } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getConfirmedTransactionsByEvent } from '../../selectors';
import { GREY } from '../../constants';
import { clearConfirmation } from '../../actions';
import { UpcomingEvents, FadeInView } from '../shared';
import { NormalText } from '../styled';
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
        <UpcomingEvents forReceiptPage events={this.props.items} />
      </FadeInView>
    );
  }
}

ReceiptPage.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape()),
  clearConfirmation: PropTypes.func,
};

const mapStateToProps = state => ({
  items: getConfirmedTransactionsByEvent(state),
});

const mapDispatchToProps = {
  clearConfirmation,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReceiptPage);
