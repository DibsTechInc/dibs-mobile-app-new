import React, { PureComponent } from 'react';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import { GiftedForm } from 'react-native-gifted-form';
import PropTypes from 'prop-types';

import { MaterialPanel } from '../../shared';
import Config from '../../../../config.json';
import { getUserEmail, getAlertInputValue } from '../../../selectors';
import { disableUserAccount, enqueueNotice, enqueueUserError } from '../../../actions';
import { LANDING_ROUTE, WHITE, GREY } from '../../../constants';

/**
 * @class DisableAccount
 * @extends {Component}
 */
class DisableAccount extends PureComponent {
   /**
   * @constructor
   * @param {object} props from parent
   * @constructs DisableAccount
   */
  constructor(props) {
    super(props);

    this.handleOnPress = this.handleOnPress.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleOnChange = this.handleOnChange.bind(this);
  }

  /**
   *
   * @param {boolean} isValid input
   * @param {Object} payload to submit
   * @param {Object} validationResults result
   * @param {function} postSubmit callback
   * @returns {undefined}
   */
  async handleOnPress(isValid, { email, firstName, lastName }, validationResults, postSubmit = null) {
    this.props.enqueueNotice({
      title: 'Deactivate Account',
      message: 'Please enter the email address associated with this account.',
      buttons: [{
        text: 'CANCEL',
        onPress: () => {},
      }, {
        text: 'CONFIRM',
        onPress: this.handleDelete,
      }],
      showInput: true,
      placeholder: 'abc@xyz.com',
    });
    postSubmit();
  }

  /**
   * @param {string} email users email
   * @returns {undefined}
   */
  handleOnChange(email) {
    this.setState({ email });
  }

  /**
   * @returns {undefined}
   */
  async handleDelete() {
    if (this.props.inputValue.toLowerCase() !== this.props.userEmail.toLowerCase()) {
      this.props.enqueueUserError({
        title: 'Uh oh!',
        message: 'The email you provided is incorrect.',
      });
      return;
    }

    const { success } = await this.props.disableUserAccount();

    if (success) {
      this.props.navigation.navigate(LANDING_ROUTE);
    }
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (!this.props.isUpdatingDisableAccount) {
      return (
        <MaterialPanel
          height={100}
          style={{ shadowOffset: { width: 3, height: 3 } }}
          heading="Deactivate Account"
          headingRight={this.props.isUpdatingDisableAccount ? 'Cancel' : '...'}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10, color: GREY }}
          onPressHeadingRight={this.props.setEditDisableAccount}
        />
      );
    }

    return (
      <MaterialPanel
        style={{ shadowOffset: { width: 3, height: 3 }, overflow: 'visible' }}
        heading="Deactivate Account"
        headingRight={this.props.isUpdatingDisableAccount ? 'Cancel' : '...'}
        headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
        headerStyle={{ marginLeft: 10, color: GREY }}
        onPressHeadingRight={this.props.setEditDisableAccount}
      >
        <GiftedForm
          formName="deactivateAccountForm"
          style={{ backgroundColor: WHITE }}
          clearOnClose
        >
          <GiftedForm.SubmitWidget
            title="Deactivate Account"
            widgetStyles={{
              submitButton: {
                backgroundColor: Config.STUDIO_COLOR,
                borderRadius: 5,
                margin: 0,
                marginTop: 20,
              },
              textSubmitButton: {
                fontSize: 16,
                fontFamily: 'studio-font',
              },
            }}
            onSubmit={this.handleOnPress}
          />
        </GiftedForm>
      </MaterialPanel>
    );
  }
}

DisableAccount.propTypes = {
  setEditDisableAccount: PropTypes.func.isRequired,
  isUpdatingDisableAccount: PropTypes.bool.isRequired,
  disableUserAccount: PropTypes.func.isRequired,
  navigation: PropTypes.shape().isRequired,
  enqueueNotice: PropTypes.func.isRequired,
  enqueueUserError: PropTypes.func.isRequired,
  inputValue: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  userEmail: getUserEmail(state),
  inputValue: getAlertInputValue(state),
});

const mapDispatchToProps = {
  disableUserAccount,
  enqueueNotice,
  enqueueUserError,
};

const connectedDisableAccount = connect(mapStateToProps, mapDispatchToProps)(DisableAccount);
const navigatedDisableAccount = withNavigation(connectedDisableAccount);

export default navigatedDisableAccount;

