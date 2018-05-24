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
import { MaterialButton, DibsLoader, FadeInView, InputField } from '../shared';
import { DEFAULT_BG, GREY } from '../../constants';
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

const StyledText = NormalText.extend`
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
      resultMessage: '',
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
      this.setState({ resultMessage: 'Please enter a valid email address' });
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
      resultMessage: response.success ? 'Your email has been updated' : response.message,
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
          <DibsLoader dotColor={Config.STUDIO_COLOR} />
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
              text="Update"
              disabled={!validSubmission}
              backgroundColor={!validSubmission ? GREY : Config.STUDIO_COLOR}
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

