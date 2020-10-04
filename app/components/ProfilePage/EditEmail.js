import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  ScrollView,
} from 'react-native';
import styled from 'styled-components';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';
import Promise from 'bluebird';

import { updateUser } from '../../actions';
import { MaterialButton, LinearLoader, FadeInView, InputField } from '../shared';
import { DEFAULT_BG, LIGHT_GREY, RED } from '../../constants';
import Config from '../../../config.json';
import Header from '../Header';
import { NormalText } from '../styled';
import { getUserEmail } from '../../selectors';

const StyledButtonView = styled.View`
  padding: 8px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const StyledText = styled(NormalText)`
  margin-bottom: 7%;
`;

/**
 * @class Signup
 * @extends PureComponent
 */
class EditEmail extends PureComponent {
  /**
   * @constructor
   * @constructs Signup
   * @param {Object} props for component
   */
  constructor() {
    super();

    this.state = {
      email: '',
      successMessage: '',
      errorMessage: '',
      isLoading: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    const isValidEmail = validEmail.test(this.state.email);

    if (!isValidEmail) {
      this.setState({ errorMessage: 'Please enter a valid email address', successMessage: '' });
      return;
    }

    const payload = {
      email: this.state.email,
    };

    this.setState({ isLoading: true });
    const response = await new Promise(res => this.props.updateUser(payload, res));
    this.setState({
      isLoading: false,
      email: '',
      successMessage: response.success ? 'Email successfully updated!' : '',
      errorMessage: !response.success ? response.message : '',
    });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const validSubmission = this.state.email.length;

    if (this.state.isLoading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <LinearLoader showQuote color={Config.STUDIO_COLOR} />
        </FadeInView>
      );
    }

    return (
      <FadeInView>
        <Header title="My Account" />
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', height: '60%', position: 'relative' }}>
          <StyledText>
            Update your email below
          </StyledText>
          <InputField
            customFocus
            autoCapitalize="none"
            value={this.state.email}
            onChangeText={email => this.setState({ email })}
            placeholder={this.props.email}
            containerStyle={{ marginBottom: 20, width: 250 }}
          />
          {this.state.errorMessage.length ? <StyledText style={{ position: 'absolute', left: '20%', top: '58%', color: RED, fontSize: 12 }}>{this.state.errorMessage}</StyledText> : undefined}
          {this.state.successMessage.length ? <StyledText style={{ position: 'absolute', left: '20%', top: '58%', fontSize: 12 }}>{this.state.successMessage}</StyledText> : undefined}
        </ScrollView>
        <KeyboardAccessoryView
          alwaysVisible
          hideBorder
          style={{ backgroundColor: DEFAULT_BG, marginBottom: 25 }}
        >
          <StyledButtonView>
            <MaterialButton
              onPress={this.handleOnPress}
              text="Update"
              disabled={!validSubmission}
              backgroundColor={!validSubmission ? LIGHT_GREY : Config.STUDIO_COLOR}
              style={{ width: '75%', height: 40 }}
            />
          </StyledButtonView>
        </KeyboardAccessoryView>
      </FadeInView>
    );
  }
}

EditEmail.propTypes = {
  updateUser: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  email: getUserEmail(state),
});

const mapDispatchToProps = {
  updateUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(EditEmail);

