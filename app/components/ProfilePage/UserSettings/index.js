import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import Header from '../../Header';
import { FadeInView } from '../../shared';
import { WHITE, BLACK } from '../../../constants';
import EmailPreferences from './EmailPreferences';
import DisableAccount from './DisableAccount';

class UserSettings extends PureComponent {
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

  render() {
    return (
      <FadeInView>
        <Header
          iconColor={BLACK}
          backgroundColor={WHITE}
          showCart={false}
          headerStyle={{ height: 80 }}
        />
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

