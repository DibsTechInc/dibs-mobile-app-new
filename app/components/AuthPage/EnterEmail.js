
import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import {
  Alert,
} from 'react-native';
import Promise from 'bluebird';

import { validateEmail } from '../../actions/UserActions';
import { FadeInView, InputField, DibsLoader } from '../shared';
import Config from '../../../config.json';

/**
 * @class EnterEmail
 * @extends Component
 */
class EnterEmail extends Component {
  /**
   * @constructor
   * @constructs EnterEmail
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      isLoading: false,
    };
    this.handleOnPress = this.handleOnPress.bind(this);
  }
  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const { email } = this.state;

    const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const isValidEmail = validEmail.test(email);

    if (!isValidEmail) {
      Alert.alert('Please enter a valid email address.');
      return;
    }

    await new Promise(res => this.setState({ isLoading: true }, res));
    const route = await new Promise(res => this.props.validateEmail(email, res));
    await new Promise(res => this.setState({ isLoading: false }, res));

    if (!route) {
      this.setState({ isLoading: false });
      Alert.alert('Uh oh, we could not verify this email. Please contact support.');
    } else {
      this.props.navigation.navigate(route, { email, fromReset: false }); // last key for PW reset
    }
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.state.isLoading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <DibsLoader dotColor={Config.STUDIO_COLOR} />
        </FadeInView>
      );
    }

    return (
      <FadeInView style={{ justifyContent: 'center', alignItems: 'center', marginBottom: '30%' }}>
        <InputField
          autoFocus
          label="What is your email?"
          returnKeyType="go"
          placeholder="Email"
          autoCapitalize="none"
          onChangeText={email => this.setState({ email })}
          onSubmitEditing={this.handleOnPress}
          value={this.state.email}
          containerStyle={{
            marginBottom: this.state.emailError ? 10 : 50,
            width: 200,
          }}
          labelStyle={{ marginBottom: 5, textAlign: 'center' }}
        />
      </FadeInView>
    );
  }
}

EnterEmail.propTypes = {
  navigation: PropTypes.shape(),
};

const mapDispatchToProps = {
  validateEmail,
};

export default connect(null, mapDispatchToProps)(EnterEmail);
