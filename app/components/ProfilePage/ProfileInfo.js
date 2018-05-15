import React, { Component } from 'react';
import { connect } from 'react-redux';
import Header from '../Header';
import { FadeInView, PaymentInfo } from '../shared';
import { WHITE, BLACK } from '../../constants';

class ProfileInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isUpdatingCard: false,
      isProcessingPayment: false,
    };

    this.setLoading = this.setLoading.bind(this);
    this.setEditCC = this.setEditCC.bind(this);
  }

  /**
   * @param {bool} bool the state of the loading
   * @returns {undefined}
   */
  setLoading(bool) {
    this.setState({
      isLoading: bool,
    });
  }

  /**
   * @param {bool} bool the state of the editing
   * @returns {undefined}
   */
  setEditCC() {
    this.setState({
      isUpdatingCard: !this.state.isUpdatingCard,
    });
  }

  render() {
    return (
      <FadeInView>
        <Header
          iconColor={BLACK}
          backgroundColor={WHITE}
        />
        <PaymentInfo
          isLoading={this.state.isLoading}
          isUpdatingCard={this.state.isUpdatingCard}
          setLoading={this.setLoading}
          setEditCC={this.setEditCC}
        />
      </FadeInView>
    );
  }
}

export default ProfileInfo;

