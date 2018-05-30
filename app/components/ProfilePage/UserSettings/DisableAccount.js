import React, { PureComponent } from 'react';
import { Button, View } from 'react-native';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import { GiftedForm } from 'react-native-gifted-form';
import PropTypes from 'prop-types';
import Dialog from 'react-native-dialog';

import { FadeInView, MaterialPanel } from '../../shared';
import Config from '../../../../config.json';
import { getUserEmail } from '../../../selectors';
import { disableUserAccount } from '../../../actions';
import { LANDING_ROUTE, WHITE, GREY } from '../../../constants';

/**
 * @class DeleteDialog
 * @extends {Component}
 */
class DeleteDialog extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView>
        <Dialog.Container visible={this.props.dialogVisible}>
          <Dialog.Title>Deactivate Account</Dialog.Title>
          <Dialog.Description>
            Please enter the email address associated with this account
          </Dialog.Description>
          <Dialog.Description>
            {this.props.errorMessage}
          </Dialog.Description>
          <Dialog.Input
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="abc@xyz.com"
            onChangeText={this.props.handleOnChange}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingLeft: 30, paddingRight: 30 }}>
            <Button title="Cancel" onPress={this.props.handleCancel} />
            <Button title="Confirm" onPress={this.props.handleDelete} />
          </View>
        </Dialog.Container>
      </FadeInView>
    );
  }
}

DeleteDialog.propTypes = {
  dialogVisible: PropTypes.bool,
  errorMessage: PropTypes.string,
  handleOnChange: PropTypes.func,
  handleCancel: PropTypes.func,
  handleDelete: PropTypes.func,
};

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

    this.state = {
      dialogVisible: false,
      errorMessage: '',
      email: '',
    };

    this.handleOnSubmit = this.handleOnSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
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
  async handleOnSubmit(isValid, { email, firstName, lastName }, validationResults, postSubmit = null) {
    this.setState({ dialogVisible: true });
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
  handleCancel() {
    this.setState({ dialogVisible: false });
  }

  /**
   * @returns {undefined}
   */
  async handleDelete() {
    if (this.state.email !== this.props.userEmail) {
      this.setState({
        errorMessage: 'The email you provided is incorrect',
      });
      return;
    }

    const response = await new Promise(res => this.props.disableUserAccount(res));

    if (response.code === 200) {
      this.setState({ dialogVisible: false });
      this.props.navigation.navigate(LANDING_ROUTE);
    } else {
      this.setState({ errorMessage: response.message });
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
          headingRight={this.props.isUpdatingDisableAccount ? 'Cancel' : 'Change'}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10, color: GREY }}
          onPressHeadingRight={this.props.setEditDisableAccount}
        />
      );
    }

    return (
      <MaterialPanel
        height={'20%'}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Deactivate Account"
        headingRight={this.props.isUpdatingDisableAccount ? 'Cancel' : 'Change'}
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
                fontFamily: 'flex-font',
              },
            }}
            onSubmit={this.handleOnSubmit}
          />
        </GiftedForm>
        <DeleteDialog
          dialogVisible={this.state.dialogVisible}
          handleCancel={this.handleCancel}
          handleDelete={this.handleDelete}
          handleOnChange={this.handleOnChange}
          errorMessage={this.state.errorMessage}
        />
      </MaterialPanel>

    )
  }
}

DisableAccount.propTypes = {
  setEditDisableAccount: PropTypes.func.isRequired,
  isUpdatingDisableAccount: PropTypes.bool.isRequired,
  disableUserAccount: PropTypes.func.isRequired,
  navigation: PropTypes.shape().isRequired,
};

const mapStateToProps = state => ({
  userEmail: getUserEmail(state),
});

const mapDispatchToProps = {
  disableUserAccount,
};

const connectedDisableAccount = connect(mapStateToProps, mapDispatchToProps)(DisableAccount);
const navigatedDisableAccount = withNavigation(connectedDisableAccount);

export default navigatedDisableAccount;

