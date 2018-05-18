import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import Header from '../../Header';
import { FadeInView } from '../../shared';
import { WHITE, BLACK } from '../../../constants';
import EmailPreferences from './EmailPreferences';

class UserSettings extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isUpdatingEmailPreferences: false,
    };

    this.setEditEmailPreferences = this.setEdit.bind(this, 'isUpdatingEmailPreferences');
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
      </FadeInView>
    );
  }
}

export default UserSettings;

