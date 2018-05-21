
import React, { PureComponent } from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import Promise from 'bluebird';

import { validateEmail } from '../../actions/UserActions';
import { FadeInView, InputField, DibsLoader } from '../shared';
import Config from '../../../config.json';

const ErrorText = styled.Text`
  font-family: flex-font;
  font-size: 12;
  color: red;
`;

/**
 * @class EnterEmail
 * @extends Component
 */
class EnterEmail extends PureComponent {
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
      errorText: '',
      validInput: false,
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
      this.setState({ errorText: 'Please enter a valid email address.' });
      return;
    }

    await new Promise(res => this.setState({ isLoading: true, validInput: true }, res));
    const route = await new Promise(res => this.props.validateEmail(email, res));
    await new Promise(res => this.setState({ isLoading: false }, res));

    if (!route) {
      this.setState({ isLoading: false, errorText: 'Uh oh, we could not verify this email. Please contact support.' });
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center', marginBottom: '30%' }}>
          <InputField
            customFocus
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
            blurOnSubmit={this.state.validInput}
          />
          {this.state.errorText.length && <ErrorText>{this.state.errorText}</ErrorText>}
        </FadeInView>
      </TouchableWithoutFeedback>
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
