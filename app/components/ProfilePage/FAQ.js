import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

class FAQ extends PureComponent {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'flex-font-heavy' }}>Questions? Answers.</Text>
        <Text style={{ fontFamily: 'flex-font-heavy' }}>What if I can’t make a class I booked anymore?</Text>
        <Text style={{ fontFamily: 'flex-font' }}>We get it - stuff comes up. If you need to drop a class, your account will be credited the full amount you paid. This credit will be automatically applied towards your next booking at Core Collective. Just be sure you drop within Core Collective&apos;
        s drop window, otherwise, no credit will be returned.

        Core Collective&apos;s drop policy is 12 hours before the start.

        To drop, click the &quot;Classes&quot; page and &quot;X&quot; the class you can no longer attend.</Text>
        <Text style={{ fontFamily: 'flex-font-heavy' }}>How do I switch my class?</Text>
        <Text style={{ fontFamily: 'flex-font' }}>Due to the nature of dynamic pricing, bookings are non-transferrable. But you can modify your class! Simply drop the class you can no longer attend and book another class.

        If you do this in advance of the studio’s drop policy, your account will be credited the full amount you paid, and you will only be charged for the difference in price.

        If you book into a lower priced class, you will receive a credit for the difference in price. The credit will be applied to your next booking at Core Collective.</Text>
        <Text style={{ fontFamily: 'flex-font-heavy' }}>How does Dibs determine prices?</Text>
        <Text style={{ fontFamily: 'flex-font' }}>Dibs’ algorithms analyze multiple data points to make real-time adjustments that depend entirely on current market conditions. Prices increase with demand – the earlier you book, the better your price. The more you book, the better your price.</Text>
        <Text style={{ fontFamily: 'flex-font-heavy' }}>Will prices go down after I book?</Text>
        <Text style={{ fontFamily: 'flex-font' }}>Nope! Classes are priced based on market demand, and increase as class time approaches. Book early for the best rate.</Text>
      </View>
    );
  }
}

export default FAQ;

