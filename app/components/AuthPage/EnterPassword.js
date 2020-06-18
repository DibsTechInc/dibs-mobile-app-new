import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import styled from 'styled-components';
import Promise from 'bluebird';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';

import Config from '../../../config.json';

import {
  getStudioWaiverRequirement,
  getStudioName,
} from '../../selectors';
import {
  submitLogin,
  reactivateUserAccount,
  getUserWaivers,
  updateUserWaiverChecked,
} from '../../actions';
import {
  FadeInView,
  InputField,
  LinearLoader,
  MaterialButton,
} from '../shared';
import { DEFAULT_BG } from '../../constants';

import { NormalText } from '../styled';

import {
  MAIN_ROUTE,
  PASSWORD_RESET_ROUTE,
  LANDING_ROUTE,
} from '../../constants/RouteConstants/index';

import TermsCheckBox from './TermsCheckBox';

const StyledButtonView = styled.View`
  padding: 8px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ErrorText = styled(NormalText)`
  fontSize: 12px;
  color: red;
  position: absolute;
  top: ${props => props.requiresWaiver ? '70%' : '50%'};
`;

/**
 * @class EnterPassword
 * @extends Component
 */
class EnterPassword extends React.PureComponent {
  /**
   * @constructor
   * @constructs EnterPassword
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      password: '',
      isLoading: false,
      validInput: false,
      errorText: '',
      tAndCError: '',
      tAndC: false,
    };

    this.handleOnPress = this.handleOnPress.bind(this);
    this.navigateToPasswordReset = this.navigateToPasswordReset.bind(this);
    this.handleTermsAndConditions = this.handleTermsAndConditions.bind(this);
    this.handleOnCheck = this.handleOnCheck.bind(this);
  }

  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    const { email } = this.props.navigation.state.params;
    await this.props.getUserWaivers({ type: 'email', source: email });

    this.handleTermsAndConditions();
  }

  /**
   * @returns {undefined}
   */
  handleTermsAndConditions() {
    this.setState({
      tAndC: this.props.userHasSignedWaiver,
    });
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
   * @returns {undefined}
   */
  async handleOnPress() {
    const { email, accountDisabled } = this.props.navigation.state.params;

    if (this.props.studioRequiresWaiverSigned && !this.state.tAndC) {
      this.setState({ isLoading: false, errorText: 'You must agree to the Terms and Conditions' });
      return;
    }

    if (accountDisabled) {
      const response = await new Promise(res => this.props.reactivateUserAccount(email, this.state.password, res));

      if (response.code === 200) this.props.navigation.navigate(LANDING_ROUTE, { accountReactivated: true });
      else this.setState({ errorText: response.message });
      return;
    }

    await new Promise(res => this.setState({ isLoading: true, validInput: true }, res));
    const response = await new Promise(res => this.props.submitLogin(email, this.state.password, res));
    await this.props.updateUserWaiverChecked(this.state.tAndC, this.props.userId);
    await new Promise(res => this.setState({ errorText: '' }, res));

    if (response.code !== 200) {
      this.setState({ isLoading: false, errorText: 'Invalid password' });
      return;
    }

    await Promise.delay(Config.LOADING_QUOTES?.length && 2000);
    this.props.navigation.navigate(MAIN_ROUTE);
  }

  /**
   * @returns {undefined}
   */
  navigateToPasswordReset() {
    const { email } = this.props.navigation.state.params;
    this.props.navigation.navigate(PASSWORD_RESET_ROUTE, { email });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (this.state.isLoading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <LinearLoader
            color={Config.STUDIO_COLOR}
            showQuote
          />
        </FadeInView>
      );
    }

    const shouldShowTerms = this.props.studioRequiresWaiverSigned && !this.props.userHasSignedWaiver;

    return (
      <FadeInView>
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', height: '70%', position: 'relative' }}>
          <InputField
            customFocus={!this.state.validInput}
            label={(
              this.props.navigation.state.params.accountDisabled ?
                'Please enter the password associated with this account to reactivate it' : 'What is your password?'
            )}
            returnKeyType="go"
            blurOnSubmit={this.state.validInput}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={this.handleOnPress}
            onChangeText={password => this.setState({ password })}
            containerStyle={{ marginBottom: shouldShowTerms ? 10 : 30, width: 200, minWidth: 200 }}
            labelStyle={{ marginBottom: 20, textAlign: 'center' }}
          />
          {!!shouldShowTerms &&
            <TermsCheckBox
              studioName={this.props.studioName}
              tAndC={this.state.tAndC}
              tAndCError={this.state.tAndCError}
              onPress={this.handleOnCheck}
            />
          }
          {!!this.state.errorText.length &&
            <ErrorText requiresWaiver={shouldShowTerms}>
              {this.state.errorText}
            </ErrorText>}
          <TouchableOpacity
            onPress={this.navigateToPasswordReset}
            style={{ marginBottom: 20 }}
          >
            <NormalText style={{ marginTop: shouldShowTerms ? 60 : 0 }}>
              Forgot your password?
            </NormalText>
          </TouchableOpacity>
        </ScrollView>
        <KeyboardAccessoryView
          alwaysVisible
          hideBorder
          style={{ backgroundColor: DEFAULT_BG, marginBottom: 25 }}
        >
          <StyledButtonView>
            <MaterialButton
              onPress={this.handleOnPress}
              text="Log in"
              style={{ width: '75%', height: 40 }}
            />
          </StyledButtonView>
        </KeyboardAccessoryView>
      </FadeInView>
    );
  }
}

EnterPassword.propTypes = {
  navigation: PropTypes.shape(),
  submitLogin: PropTypes.func,
  reactivateUserAccount: PropTypes.func,
  studioRequiresWaiverSigned: PropTypes.bool,
  getUserWaivers: PropTypes.func,
  userHasSignedWaiver: PropTypes.bool,
  studioName: PropTypes.string,
  updateUserWaiverChecked: PropTypes.func,
  userId: PropTypes.number,
};

const mapStateToProps = state => ({
  userHasSignedWaiver: state.user.waiver,
  userId: state.user.userid,
  studioRequiresWaiverSigned: getStudioWaiverRequirement(state),
  studioName: getStudioName(state),
});

const mapDispatchToProps = {
  submitLogin,
  reactivateUserAccount,
  getUserWaivers,
  updateUserWaiverChecked,
};

export default connect(mapStateToProps, mapDispatchToProps)(EnterPassword);
