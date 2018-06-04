import React, { PureComponent } from 'react';
import Header from '../Header';

import { NormalText } from '../styled';
import { FadeInView } from '../shared';

/**
 * @class FAQ
 * @extends PureComponent
 */
class FAQ extends PureComponent {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView>
        <Header title="FAQ" />
        <FadeInView style={{ padding: 10, justifyContent: 'center', alignItems: 'center' }}>
          <NormalText style={{ fontFamily: 'studio-font-heavy' }}>
            Questions? Answers.
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font-heavy' }}>
            What if I can’t make a class I booked anymore?
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font' }}>
            We get it - stuff comes up. If you need to drop a class, your account will be credited the full amount you paid. This credit will be automatically applied towards your next booking at Core Collective. Just be sure you drop within Core Collective&apos;s drop window, otherwise, no credit will be returned.

            Core Collective&apos;s drop policy is 12 hours before the start.

            To drop, click the &quot;Classes&quot; page and &quot;X&quot; the class you can no longer attend.
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font-heavy' }}>
            How do I switch my class?
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font' }}>
            Due to the nature of dynamic pricing, bookings are non-transferrable. But you can modify your class! Simply drop the class you can no longer attend and book another class.

            If you do this in advance of the studio’s drop policy, your account will be credited the full amount you paid, and you will only be charged for the difference in price.

            If you book into a lower priced class, you will receive a credit for the difference in price. The credit will be applied to your next booking at Core Collective.
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font-heavy' }}>
            How does Dibs determine prices?
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font' }}>
            Dibs’ algorithms analyze multiple data points to make real-time adjustments that depend entirely on current market conditions. Prices increase with demand – the earlier you book, the better your price. The more you book, the better your price.
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font-heavy' }}>
            Will prices go down after I book?
          </NormalText>
          <NormalText style={{ fontFamily: 'studio-font' }}>
            Nope! Classes are priced based on market demand, and increase as class time approaches. Book early for the best rate.
          </NormalText>
        </FadeInView>
      </FadeInView>
    );
  }
}

export default FAQ;

