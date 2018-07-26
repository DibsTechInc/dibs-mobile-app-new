import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { connect } from 'react-redux';

import { enqueueUserError } from '../../../actions';
import { FadeInView, InputField, MaterialButton } from '../../shared';
import { FlexCenter } from '../../styled';

const ButtonContainer = styled.View`
  align-items: center;
  width: 100%;
`;

/**
 * @class NewPassword
 * @extends {React.PureComponent}
 */
class NewPassword extends React.PureComponent {
  /**
   * @constructor
   * @constructs NewPassword
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      password: '',
      passwordConfirmation: '',
    };
    this.onPasswordChange = this.onChange.bind(this, 'password');
    this.onPasswordConfirmationChange = this.onChange.bind(this, 'passwordConfirmation');
    this.onSubmit = this.onSubmit.bind(this);
  }
  /**
   * @param {string} key in state to change
   * @param {string} value to set it to
   * @returns {undefined}
   */
  onChange(key, value) {
    this.setState({ [key]: value });
  }
  /**
   * @returns {undefined}
   */
  onSubmit() {
    if (this.state.password.length < 6) {
      this.props.enqueueUserError({ title: 'Error!', message: 'Your password must be at least 6 characters' });
      return;
    }

    if (this.state.password !== this.state.passwordConfirmation) {
      this.props.enqueueUserError({ title: 'Error!', message: 'The password confirmation does not match!' });
      return;
    }
    this.props.onSubmit(this.state.password);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ flex: 1 }}
            resetScrollToCoords={{ x: 0, y: 0 }}
          >
            <FlexCenter style={{ width: '100%' }}>
              <InputField
                customFocus
                autoCapitalize="none"
                onChangeText={this.onPasswordChange}
                label="Enter your new password"
                secureTextEntry
                containerStyle={{ marginBottom: 30, width: 200, minWidth: 200 }}
                labelStyle={{ marginBottom: 20 }}
                placeholder="New password (6 char min)"
              />
              <InputField
                customFocus
                autoCapitalize="none"
                onChangeText={this.onPasswordConfirmationChange}
                label="Confirm your new password"
                secureTextEntry
                containerStyle={{ marginBottom: 80, width: 200, minWidth: 200 }}
                labelStyle={{ marginBottom: 20 }}
                placeholder="Confirm new password"
                onSubmitEditing={this.onSubmit}
              />
              <ButtonContainer>
                <MaterialButton
                  onPress={this.onSubmit}
                  text="Submit"
                  style={{ width: 200, height: 40 }}
                />
              </ButtonContainer>
            </FlexCenter>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </FadeInView>
    );
  }
}

NewPassword.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  enqueueUserError: PropTypes.func,
};

// const mapStateToProps = state => ({});
const mapDispatchToProps = { enqueueUserError };

export default connect(null, mapDispatchToProps)(NewPassword);
