import React, { PureComponent } from 'react';

import Header from '../../Header';
import { FadeInView } from '../../shared';
import EmailPreferences from './EmailPreferences';
import DisableAccount from './DisableAccount';

/**
 * @class UserSettings
 * @extends PureComponent
 */
class UserSettings extends PureComponent {
  /**
   * @constructor
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isUpdatingEmailPreferences: false,
      isUpdatingDisableAccount: false,
    };
    this.setEditEmailPreferences = this.setEdit.bind(this, 'isUpdatingEmailPreferences');
    this.setEditDisableAccount = this.setEdit.bind(this, 'isUpdatingDisableAccount');
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
        <Header title="Settings" />
        <EmailPreferences
          setEditEmailPreferences={this.setEditEmailPreferences}
          isUpdatingEmailPreferences={this.state.isUpdatingEmailPreferences}
        />
        <DisableAccount
          setEditDisableAccount={this.setEditDisableAccount}
          isUpdatingDisableAccount={this.state.isUpdatingDisableAccount}
        />
      </FadeInView>
    );
  }
}

export default UserSettings;

