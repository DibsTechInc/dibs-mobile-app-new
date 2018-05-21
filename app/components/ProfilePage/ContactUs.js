import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';
import Header from '../Header';

/**
 * @class ContactUs
 * @extends PureComponent
 */
class ContactUs extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <View>
        <Header title="Contact Us" />
        <Text>Questions? Feedback?</Text>
        <Text>Text or call: +44 20 3389 8689</Text>
        <Text>Email: info@ondibs.com</Text>
      </View>
    );
  }
}

export default ContactUs;

