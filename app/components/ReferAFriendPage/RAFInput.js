import React from 'react';
import PropTypes from 'prop-types';
import { Keyboard } from 'react-native';
import styled from 'styled-components';

import { SpecialField, LinearLoader } from '../shared';
import Config from '../../../config.json';

const LoadingContainer = styled.View`
  justify-content: center;
  width: 100%;
  padding-top: 10px;
  height: 50px;
`;

/**
 * @class RAFInput
 * @extends {React.PureComponent}
 */
class RAFInput extends React.PureComponent {
  /**
   * @constructor
   * @constructs RAFInput
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      errorMessage: '',
      noticeMessage: '',
    };

    this.handleOnChangeEmail = this.handleOnChangeEmail.bind(this);
    this.handlePress = this.handlePress.bind(this);
  }
  /**
   * @param {string} value - the input value
   * @returns {undefined}
   */
  handleOnChangeEmail(value) {
    this.setState({ email: value });
  }
  /**
   * @returns {undefined}
   */
  async handlePress() {
    const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isValidEmail = validEmail.test(this.state.email);

    this.setState({ noticeMessage: '', errorMessage: '' });

    if (!isValidEmail) {
      this.setState({ errorMessage: 'Please enter a valid email address.' });
      return;
    }

    const res = await this.props.sendFriendReferral(this.state.email);

    if (res.success) {
      this.setState({ noticeMessage: res.message });
    } else {
      this.setState({ errorMessage: res.message });
    }

    this.setState({ email: '' });
    Keyboard.dismiss();
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const loadRAFInput = this.props.loading ?
    (
      <LoadingContainer>
        <LinearLoader color={Config.STUDIO_COLOR} />
      </LoadingContainer>
    ) :
    (
      <SpecialField
        inputStateItem={this.state.email}
        handleChange={this.handleOnChangeEmail}
        handlePress={this.handlePress}
        isCartPage={false}
        buttonText="Invite"
        shouldFocus={this.props.shouldFocus}
        onFocusFunc={this.props.onFocusFunc}
        errorMessage={this.state.errorMessage}
        noticeMessage={this.state.noticeMessage}
        placeholderText="Enter friend's email here"
      />
    );

    return loadRAFInput;
  }
}

RAFInput.propTypes = {
  shouldFocus: PropTypes.bool,
  loading: PropTypes.bool,
  sendFriendReferral: PropTypes.func,
  onFocusFunc: PropTypes.func,
};

export default RAFInput;
