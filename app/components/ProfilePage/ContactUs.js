import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

class ContactUs extends PureComponent {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Questions? Feedback?</Text>
        <Text>Text or call: +44 20 3389 8689</Text>
        <Text>Email: info@ondibs.com</Text>
      </View>
    );
  }
}

export default ContactUs;

