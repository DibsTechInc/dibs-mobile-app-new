import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import styled from 'styled-components';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';
import Promise from 'bluebird';

import { updateUserPassword } from '../../actions/UserActions';
import { MaterialButton, FadeInView, InputField, LinearLoader } from '../shared';
import { DEFAULT_BG, LIGHT_GREY, RED } from '../../constants';
import Config from '../../../config.json';
import Header from '../Header';
import { NormalText } from '../styled';

const StyledButtonView = styled.View`
  padding: 8px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const StyledText = NormalText.extend`
  margin-bottom: 7%;
`;

/**
 * @class Signup
 * @extends PureComponent
 */
class EditPassword extends PureComponent {
  /**
   * @constructor
   * @constructs Signup
   * @param {Object} props for component
   */
  constructor() {
    super();

    this.state = {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
      successMessage: '',
      error: '',
      isLoading: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    if (this.state.newPasswordConfirmation !== this.state.newPassword) {
      this.setState({ error: 'Password confirmation does not match' });
      return;
    }

    const payload = {
      password: this.state.currentPassword,
      newPassword: this.state.newPassword,
      newPasswordConfirmation: this.state.newPasswordConfirmation,
    };

    this.setState({ isLoading: true });
    const response = await this.props.updateUserPassword(payload);

    let error = 'Something went wrong updating your password.';
    if (response && response.message === 'Hmm… this is the same as your current password. Please pick a new one!') {
      error = 'New password is same as current password';
    } else if (response && response.message === 'Current password is incorrect. Please try again.') {
      error = 'Current password is incorrect.';
    }

    this.setState({
      error,
      successMessage: response && response.success ? 'Password updated!' : '',
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
      isLoading: false,
    });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const validSubmission = this.state.currentPassword.length && this.state.newPassword && this.state.newPasswordConfirmation;

    if (this.state.isLoading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <LinearLoader color={Config.STUDIO_COLOR} />
        </FadeInView>
      );
    }

    return (
      <FadeInView>
        <Header title="My Account" />
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', height: '60%', position: 'relative' }}>
          <StyledText>
            Update your password below
          </StyledText>
          <View style={{ width: 250, position: 'relative' }}>
            <InputField
              customFocus
              autoCapitalize="none"
              secureTextEntry
              value={this.state.currentPassword}
              onChangeText={currentPassword => this.setState({ currentPassword })}
              placeholder="Current password"
              containerStyle={{ marginBottom: 30, width: 250 }}
            />
            {this.state.error.length && <StyledText style={{ fontSize: 12, color: RED, position: 'absolute', bottom: -12 }}>{this.state.error}</StyledText>}
          </View>
          <InputField
            autoCapitalize="none"
            secureTextEntry
            onChangeText={newPassword => this.setState({ newPassword })}
            placeholder="New password"
            containerStyle={{ marginBottom: 30, width: 250 }}
          />
          <InputField
            autoCapitalize="none"
            secureTextEntry
            onChangeText={newPasswordConfirmation => this.setState({ newPasswordConfirmation })}
            placeholder="Confirm new password"
            containerStyle={{ marginBottom: 5, width: 250 }}
          />
          <View style={{ width: 250 }}>
            {this.state.error.length && <StyledText style={{ fontSize: 12, color: RED }}>{this.state.error}</StyledText>}
            {this.state.successMessage.length && <StyledText style={{ fontSize: 12 }}>{this.state.successMessage}</StyledText>}
          </View>
        </ScrollView>
        <KeyboardAccessoryView
          alwaysVisible
          hideBorder
          style={{ backgroundColor: DEFAULT_BG, marginBottom: 25 }}
        >
          <StyledButtonView>
            <MaterialButton
              onPress={this.handleOnPress}
              disabled={!validSubmission}
              backgroundColor={!validSubmission ? LIGHT_GREY : Config.STUDIO_COLOR}
              text="Update"
              style={{ width: 200, height: 40 }}
            />
          </StyledButtonView>
        </KeyboardAccessoryView>
      </FadeInView>
    );
  }
}

EditPassword.propTypes = {
  updateUserPassword: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  updateUserPassword,
};

export default connect(null, mapDispatchToProps)(EditPassword);

