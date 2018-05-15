import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

class UserSettings extends PureComponent {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Settings Page woohoo</Text>
      </View>
    );
  }
}

export default UserSettings;

