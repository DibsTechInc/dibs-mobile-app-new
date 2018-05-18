import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

class AboutUs extends PureComponent {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Why Book with Dynamic Pricing?</Text>
        <Text>We want to offer you the best price we can, always.
          We’ve partnered with Dibs Technology to dynamically price each spot, in every class, based on demand.
          Prices are at their lowest when the class is empty, and increases as it fills. That means you get the best price for booking early.
        </Text>
        <Text>Love Core Collective and plan to keep coming back? Look out for flash credits! These credits are Core’s way of thanking you for booking regularly.</Text>
        <Text>TIP: Book early and often for better prices.</Text>
      </View>
    );
  }
}

export default AboutUs;

