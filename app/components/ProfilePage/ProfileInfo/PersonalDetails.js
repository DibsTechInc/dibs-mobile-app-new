import React, { PureComponent } from 'react';
import { GiftedForm, GiftedFormManager } from 'react-native-gifted-form';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { MaterialPanel } from '../../shared';
import {
  getUserFirstName,
  getUserLastName,
  getUserEmail,
} from '../../../selectors';
import { updateUser } from '../../../actions';
import Config from '../../../../config.json';

/**
 * @class PersonalDetails
 * @extends {Component}
 */
class PersonalDetails extends PureComponent {
  /**
   * @constructor
   * @param {object} props from parent
   * @constructs PersonalDetails
   */
  constructor(props) {
    super(props);

    this.handleOnSubmit = this.handleOnSubmit.bind(this);
  }

  async handleOnSubmit(isValid, { email, firstName, lastName }, validationResults, postSubmit = null) {
    if (isValid === true) {
      const payload = { email, firstName, lastName };
      const response = await new Promise(res => this.props.updateUser(payload, res));
      let errMsg = null;

      if (response.code !== 200) {
        errMsg = [response.message];
        postSubmit(errMsg);
      } else {
        this.props.setEditPersonalDetails();
      }
    }
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (!this.props.isUpdatingPersonalDetails) {
      return (
        <MaterialPanel
          height={100}
          style={{ shadowOffset: { width: 3, height: 3 } }}
          heading="Personal Details"
          headingRight={this.props.isUpdatingPersonalDetails ? 'Cancel' : 'Change'}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10 }}
          onPressHeadingRight={this.props.setEditPersonalDetails}
        />
      );
    }

    return (
      <MaterialPanel
        height={'100%'}
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Personal Details"
        headingRight={this.props.isUpdatingPersonalDetails ? 'Cancel' : 'Change'}
        headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
        headerStyle={{ marginLeft: 10 }}
        onPressHeadingRight={this.props.setEditPersonalDetails}
      >
        <GiftedForm
          formName="personalDetailsForm" // GiftedForm instances that use the same name will also share the same states

          clearOnClose={true} // delete the values of the form when unmounted

          defaults={{
            firstName: this.props.firstName,
            lastName: this.props.lastName,
            email: this.props.email,
          }}

          validators={{
            firstName: {
              title: 'First name',
              validate: [{
                validator: 'isLength',
                arguments: [1, 23],
                message: '{TITLE} must be between {ARGS[0]} and {ARGS[1]} characters',
              }],
            },
            lastName: {
              title: 'Last name',
              validate: [{
                validator: 'isLength',
                arguments: [1, 23],
                message: '{TITLE} must be between {ARGS[0]} and {ARGS[1]} characters',
              }],
            },
            email: {
              title: 'Email address',
              validate: [{
                validator: 'isLength',
                arguments: [6, 255],
              }, {
                validator: 'isEmail',
              }],
            },
          }}
        >
          <GiftedForm.TextInputWidget
            name="firstName" // mandatory
            title="First name"
            placeholder="Marco"
            clearButtonMode="while-editing"
          />

          <GiftedForm.TextInputWidget
            name="lastName"
            title="Last name"
            placeholder="Polo"
            clearButtonMode="while-editing"
          />

          <GiftedForm.TextInputWidget
            name="email" // mandatory
            title="Email"
            placeholder="example@nomads.ly"
            keyboardType="email-address"
            clearButtonMode="while-editing"
          />

          <GiftedForm.SeparatorWidget />

          <GiftedForm.ErrorsWidget />

          <GiftedForm.SubmitWidget
            title="Update"
            widgetStyles={{
              submitButton: {
                backgroundColor: Config.STUDIO_COLOR,
                margin: 0,
              },
            }}
            onSubmit={this.handleOnSubmit}
          />
        </GiftedForm>
      </MaterialPanel>
    );
  }
}

PersonalDetails.propTypes = {
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  setEditPersonalDetails: PropTypes.func.isRequired,
  isUpdatingPersonalDetails: PropTypes.bool.isRequired,
  updateUser: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  firstName: getUserFirstName(state),
  lastName: getUserLastName(state),
  email: getUserEmail(state),
});

const mapDispatchToProps = {
  updateUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(PersonalDetails);
