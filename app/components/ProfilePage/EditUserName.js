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
import { DEFAULT_BG, LIGHT_GREY, BLACK, RED } from '../../constants';
import Config from '../../../config.json';
import Header from '../Header';
import { NormalText } from '../styled';
import { getUserFirstName, getUserLastName } from '../../selectors';

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
class EditUserName extends PureComponent {
  /**
   * @constructor
   * @constructs Signup
   * @param {Object} props for component
   */
  constructor() {
    super();

    this.state = {
      firstName: '',
      lastName: '',
      successMessage: '',
      errorMessage: '',
      isLoading: false,
      response: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const payload = {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
    };

    this.setState({ isLoading: true });
    const response = await new Promise(res => this.props.updateUser(payload, res));
    this.setState({
      isLoading: false,
      firstName: '',
      lastName: '',
      successMessage: response.success ? 'Name successfully updated!' : '',
      errorMessage: !response.success ? response.message : '',
      response: response.success,
    });
  }
  /**
   * @returns {JSX} XML
   */
  render() {
    const validSubmission = this.state.firstName.length || this.state.lastName.length;

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
            Update your name below
          </StyledText>
          <InputField
            customFocus
            value={this.state.firstName}
            onChangeText={firstName => this.setState({ firstName })}
            placeholder={this.props.firstName}
            containerStyle={{ marginBottom: 20, width: 250 }}
          />
          <InputField
            value={this.state.fullName}
            onChangeText={lastName => this.setState({ lastName })}
            placeholder={this.props.lastName}
            containerStyle={{ marginBottom: 20, width: 250 }}
          />
          {this.state.errorMessage.length ? <StyledText style={{ position: 'absolute', left: '20%', top: '64%', color: RED, fontSize: 12 }}>{this.state.errorMessage}</StyledText> : undefined}
          {this.state.successMessage.length ? <StyledText style={{ position: 'absolute', left: '20%', top: '64%', fontSize: 12 }}>{this.state.successMessage}</StyledText> : undefined}
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

EditUserName.propTypes = {
  updateUser: PropTypes.func.isRequired,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  firstName: getUserFirstName(state),
  lastName: getUserLastName(state),
});

const mapDispatchToProps = {
  updateUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(EditUserName);

