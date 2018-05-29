import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import styled from 'styled-components';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';
import Promise from 'bluebird';

import { updateUserPassword } from '../../actions/UserActions';
import { MaterialButton, FadeInView, InputField, LinearLoader } from '../shared';
import { DEFAULT_BG, LIGHT_GREY } from '../../constants';
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
      resultMessage: '',
      isLoading: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const payload = {
      password: this.state.currentPassword,
      newPassword: this.state.newPassword,
      newPasswordConfirmation: this.state.newPasswordConfirmation,
    };

    this.setState({ isLoading: true });
    const response = await new Promise(res => this.props.updateUserPassword(payload, res));
    this.setState({
      resultMessage: response.success ? 'Your password has been updated' : response.message,
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
          <InputField
            customFocus
            autoCapitalize="none"
            secureTextEntry
            value={this.state.currentPassword}
            onChangeText={currentPassword => this.setState({ currentPassword })}
            placeholder="Current password"
            style={{ width: 250 }}
            containerStyle={{ marginBottom: 20 }}
          />
          <InputField
            value={this.state.newPassword}
            autoCapitalize="none"
            secureTextEntry
            onChangeText={newPassword => this.setState({ newPassword })}
            placeholder="New password"
            style={{ width: 250 }}
            containerStyle={{ marginBottom: 20 }}
          />
          <InputField
            value={this.state.newPasswordConfirmation}
            autoCapitalize="none"
            secureTextEntry
            onChangeText={newPasswordConfirmation => this.setState({ newPasswordConfirmation })}
            placeholder="Confirm new password"
            style={{ width: 250 }}
            containerStyle={{ marginBottom: 20 }}
          />
          {this.state.resultMessage.length && <StyledText>{this.state.resultMessage}</StyledText>}
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
              style={{ width: '75%', height: 40 }}
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

