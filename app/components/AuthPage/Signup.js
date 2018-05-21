import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Alert,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { CheckBox } from 'react-native-elements';
import styled from 'styled-components';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';
import Promise from 'bluebird';
import { signUpUser } from '../../actions/UserActions';
import { MaterialButton, CustomStatusBar, FadeInView, InputField } from '../shared';
import { TERMS_AND_CONDITIONS_ROUTE, MAIN_ROUTE, LOGIN_ROUTE, DEFAULT_BG } from '../../constants';
import Config from '../../../config.json';
import DibsLoader from '../shared/DibsLoader';

const StyledButtonView = styled.View`
  padding: 8px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const StyledText = styled.Text`
  font-family: flex-font;
  margin-bottom: 7%;
`;

/**
 * @class Signup
 * @extends Component
 */
class Signup extends Component {
  /**
   * @constructor
   * @constructs Signup
   * @param {Object} props for component
   */
  constructor() {
    super();

    this.state = {
      fullName: '',
      password: '',
      tAndC: false,
      errorMessage: '',
      isLoading: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
    this.checkForm = this.checkForm.bind(this);
    this.handleOnCheck = this.handleOnCheck.bind(this);
  }

  /**
   * @returns {Object} object containing canShowButton and canRegister booleans
   */
  checkForm() {
    const nameLength = this.state.fullName.length && this.state.fullName.split(' ').length;
    const passwordLength = this.state.password.length;
    const tAndC = this.state.tAndC;

    const isValidFullName = nameLength > 1 && nameLength <= 6;
    const isValidPassword = passwordLength >= 6;

    return {
      canShowButton: nameLength && passwordLength && tAndC,
      canRegister: isValidFullName && isValidPassword && tAndC,
    };
  }

  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const canRegister = this.checkForm().canRegister;

    if (!canRegister) {
      return Alert.alert('Please check the form and try again');
    }

    const payload = {
      email: this.props.navigation.state.params.email,
      fullname: this.state.fullName,
      password: this.state.password,
      signupStudioId: 20456,
      signupMethod: 'widget',
      signupStudioSource: 'mb',
      referredBy: undefined,
      signupDibsStudioId: 4,
      attempt: 0,
    };

    this.setState({ isLoading: true });
    const response = await new Promise(res => this.props.signUpUser(payload, res));
    if (response.code === 200) {
      this.props.navigation.navigate(MAIN_ROUTE);
    } else if (response.accountDisabled) {
      this.props.navigation.navigate(LOGIN_ROUTE, { accountDisabled: response.accountDisabled, email: this.props.navigation.state.params.email })
    } else {
      this.setState({ isLoading: false });
      Alert.alert(response.message);
    }

    return null;
  }

  /**
   * @returns {undefined}
   */
  handleOnCheck() {
    this.setState({
      tAndC: !this.state.tAndC,
    });
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
      <FadeInView>
        <CustomStatusBar backgroundColor={'transparent'} barStyle="dark-content" />
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', height: '60%', position: 'relative' }}>
          <StyledText>
          Just need a few details before we get started
          </StyledText>
          <InputField
            value={this.props.navigation.state.params.email || ''}
            editable={false}
            style={{ width: 250 }}
            containerStyle={{ marginBottom: 20 }}
          />
          <InputField
            customFocus
            value={this.state.fullName}
            onChangeText={fullName => this.setState({ fullName })}
            placeholder="First and last name"
            style={{ width: 250 }}
            containerStyle={{ marginBottom: 20 }}
          />
          <InputField
            value={this.state.password}
            secureTextEntry
            onChangeText={password => this.setState({ password })}
            placeholder="Password (6 char min)"
            style={{ width: 250 }}
            containerStyle={{ marginBottom: 30 }}
          />
          <View style={{ width: 250, justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity style={{ marginBottom: 10 }} onPress={() => this.props.navigation.navigate(TERMS_AND_CONDITIONS_ROUTE, { url: Config.STUDIO_TERMS_LINK })}>
              <Text style={{ color: Config.STUDIO_COLOR, fontFamily: 'flex-font' }}>Flex Studios Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.props.navigation.navigate(TERMS_AND_CONDITIONS_ROUTE, { url: Config.DIBS_TERMS_LINK })}>
              <Text style={{ color: Config.STUDIO_COLOR, fontFamily: 'flex-font' }}>Dibs Terms</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: 250, height: 30, position: 'relative', marginTop: 35 }}>
            <CheckBox
              title="I have read and agreed to the terms"
              checked={this.state.tAndC}
              containerStyle={{ backgroundColor: DEFAULT_BG, position: 'absolute', bottom: 0, left: -22 }}
              textStyle={{ fontFamily: 'flex-font', fontSize: 12 }}
              onPress={this.handleOnCheck}
              size={20}
            />
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
              text="Submit"
              style={{ width: '75%', height: 40 }}
            />
          </StyledButtonView>
        </KeyboardAccessoryView>
      </FadeInView>
    );
  }
}

Signup.propTypes = {
  navigation: PropTypes.shape(),
  signUpUser: PropTypes.func,
};

const mapDispatchToProps = {
  signUpUser,
};

export default connect(null, mapDispatchToProps)(Signup);

