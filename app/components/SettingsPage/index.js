import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

class SettingsPage extends PureComponent {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Settings Page woohoo</Text>
      </View>
    );
  }
}

export default SettingsPage;

