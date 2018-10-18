import React, { PureComponent } from 'react';
import { ScrollView } from 'react-native';
import {
  PaymentInfo,
  FadeInView,
} from '../shared';
import Header from '../Header';

/**
 * @class EditPayment
 * @extends Component
 */
class EditCC extends PureComponent {
  /**
   * @constructor
   * @constructs EditPayment
   * @param {Object} props for component
   */
  constructor() {
    super();
    this.state = { isUpdatingCard: false };
    this.setEditCC = this.setEditCC.bind(this);
  }

  /**
   * @returns {undefined}
   */
  setEditCC() {
    this.setState({ isUpdatingCard: !this.state.isUpdatingCard });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <FadeInView>
        <Header title="My Account" />
        <ScrollView keyboardShouldPersistTaps="always">
          <PaymentInfo
            isUpdatingCard={this.state.isUpdatingCard}
            setEditCC={this.setEditCC}
          />
        </ScrollView>
      </FadeInView>
    );
  }
}

export default EditCC;
