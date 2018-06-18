import React, { PureComponent } from 'react';
import Header from '../Header';

import { NormalText } from '../styled';
import { FadeInView } from '../shared';

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
      <FadeInView>
        <Header title="Contact Us" />
        <FadeInView style={{ padding: 10, justifyContent: 'center', alignItems: 'center' }}>
          <NormalText>Questions? Feedback?</NormalText>
          <NormalText>Email: info@ondibs.com</NormalText>
        </FadeInView>
      </FadeInView>
    );
  }
}

export default ContactUs;
