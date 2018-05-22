import React, { PureComponent } from 'react';
import { ScrollView } from 'react-native';
import Header from '../../Header';
import { FadeInView, PaymentInfo } from '../../shared';
import PersonalDetails from './PersonalDetails';
import Password from './Password';

/**
 * @class ProfileInfo
 * @extends {Component}
 */
class ProfileInfo extends PureComponent {
  /**
   * @constructor
   * @param {object} props from parent
   * @constructs ProfileInfo
   */
  constructor(props) {
    super(props);

    this.state = {
      isUpdatingCard: false,
      isUpdatingPersonalDetails: false,
      isUpdatingPassword: false,
    };
    this.setEditCC = this.setEdit.bind(this, 'isUpdatingCard');
    this.setEditPersonalDetails = this.setEdit.bind(this, 'isUpdatingPersonalDetails');
    this.setEditPassword = this.setEdit.bind(this, 'isUpdatingPassword');
  }

  /**
   * @param {string} stateName the name in state
   * @returns {undefined}
   */
  setEdit(stateName) {
    this.setState({
      [stateName]: !this.state[stateName],
    });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView>
        <Header title="Personal Details" />
        <ScrollView>
          <PersonalDetails
            setEditPersonalDetails={this.setEditPersonalDetails}
            isUpdatingPersonalDetails={this.state.isUpdatingPersonalDetails}
          />
          <Password
            setEditPassword={this.setEditPassword}
            isUpdatingPassword={this.state.isUpdatingPassword}
          />
          <PaymentInfo
            isUpdatingCard={this.state.isUpdatingCard}
            setEditCC={this.setEditCC}
          />
        </ScrollView>
      </FadeInView>
    );
  }
}

export default ProfileInfo;

