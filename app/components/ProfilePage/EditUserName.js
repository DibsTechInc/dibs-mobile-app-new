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
import { DEFAULT_BG, LIGHT_GREY } from '../../constants';
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

const StyledText = NormalText.extend`
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
      firstName: this.state.firstName,
      lastName: this.state.lastName,
    };

    this.setState({ isLoading: true });
    const response = await new Promise(res => this.props.updateUser(payload, res));
    this.setState({
      isLoading: false,
      firstName: '',
      lastName: '',
      resultMessage: response.success ? 'Your name has been updated' : response.message,
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
          <LinearLoader color={Config.STUDIO_COLOR} />
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
            style={{ width: 250, fontFamily: 'flex-font' }}
            containerStyle={{ marginBottom: 20 }}
          />
          <InputField
            value={this.state.fullName}
            onChangeText={lastName => this.setState({ lastName })}
            placeholder={this.props.lastName}
            style={{ width: 250, fontFamily: 'flex-font' }}
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

