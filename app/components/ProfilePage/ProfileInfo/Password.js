import React, { PureComponent } from 'react';
import { GiftedForm } from 'react-native-gifted-form';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { MaterialPanel } from '../../shared';
import {
  getUserFirstName,
  getUserLastName,
  getUserEmail,
} from '../../../selectors';
import { updateUserPassword } from '../../../actions';
import Config from '../../../../config.json';

/**
 * @class PersonalDetails
 * @extends {Component}
 */
class Password extends PureComponent {
  /**
   * @constructor
   * @param {object} props from parent
   * @constructs PersonalDetails
   */
  constructor(props) {
    super(props);

    this.handleOnSubmit = this.handleOnSubmit.bind(this);
  }

  /**
   *
   * @param {boolean} isValid input
   * @param {Object} payload to submit
   * @param {Object} validationResults result
   * @param {function} postSubmit callback
   * @returns {undefined}
   */
  async handleOnSubmit(isValid, { confirmPassword, currentPassword, newPassword }, validationResults, postSubmit = null) {
    if (isValid === true) {
      let errMsg = null;

      const payload = {
        password: currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      };

      const response = await new Promise(res => this.props.updateUserPassword(payload, res));

      if (response.code !== 200) {
        errMsg = [response.message];
        postSubmit(errMsg);
      } else {
        this.props.setEditPassword();
      }
    }
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (!this.props.isUpdatingPassword) {
      return (
        <MaterialPanel
          height={100}
          style={{ shadowOffset: { width: 3, height: 3 } }}
          heading="Password"
          headingRight={this.props.isUpdatingPassword ? 'Cancel' : 'Change'}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10 }}
          onPressHeadingRight={this.props.setEditPassword}
        />
      );
    }

    return (
      <MaterialPanel
        height={'60%'}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Password"
        headingRight={this.props.isUpdatingPassword ? 'Cancel' : 'Change'}
        headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
        headerStyle={{ marginLeft: 10 }}
        onPressHeadingRight={this.props.setEditPassword}
      >
        <GiftedForm
          formName="signupForm" // GiftedForm instances that use the same name will also share the same states
          style={{ backgroundColor: 'white' }}
          clearOnClose // delete the values of the form when unmounted
          scrollEnabled={false}
          defaults={{
            firstName: this.props.firstName,
            lastName: this.props.lastName,
            email: this.props.email,
          }}

          validators={{
            newPassword: {
              title: 'New',
              validate: [{
                validator: 'isLength',
                arguments: [6, 16],
                message: '{TITLE} password must be between {ARGS[0]} and {ARGS[1]} characters',
              }],
            },
            confirmPassword: {
              title: 'Confirm',
              validate: [{
                validator: 'isLength',
                arguments: [6, 16],
                message: '{TITLE} password must be between {ARGS[0]} and {ARGS[1]} characters',
              }],
            },
          }}
        >
          <GiftedForm.TextInputWidget
            name="currentPassword" // mandatory
            title="Current"
            placeholder="Current password"
            clearButtonMode="while-editing"
            secureTextEntry
          />

          <GiftedForm.TextInputWidget
            name="newPassword" // mandatory
            title="New"
            placeholder="New password"
            clearButtonMode="while-editing"
            secureTextEntry
          />

          <GiftedForm.TextInputWidget
            name="confirmPassword" // mandatory
            title="Confirm"
            placeholder="Confirm new password"
            clearButtonMode="while-editing"
            secureTextEntry
          />

          <GiftedForm.SeparatorWidget />

          <GiftedForm.ErrorsWidget />

          <GiftedForm.SubmitWidget
            title="Update"
            widgetStyles={{
              submitButton: {
                backgroundColor: Config.STUDIO_COLOR,
                margin: 0,
                marginTop: 10,
              },
            }}
            onSubmit={this.handleOnSubmit}
          />
        </GiftedForm>
      </MaterialPanel>
    );
  }
}

Password.propTypes = {
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  setEditPassword: PropTypes.func.isRequired,
  isUpdatingPassword: PropTypes.bool.isRequired,
  updateUserPassword: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  firstName: getUserFirstName(state),
  lastName: getUserLastName(state),
  email: getUserEmail(state),
});

const mapDispatchToProps = {
  updateUserPassword,
};

export default connect(mapStateToProps, mapDispatchToProps)(Password);
