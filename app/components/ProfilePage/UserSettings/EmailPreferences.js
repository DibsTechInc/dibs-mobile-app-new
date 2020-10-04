import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';
import { GiftedForm } from 'react-native-gifted-form';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { MaterialPanel } from '../../shared';
import { getUserSuppressionList } from '../../../selectors';
import { updateUserEmailPreferences } from '../../../actions';
import Config from '../../../../config.json';
import { WHITE, GREY } from '../../../constants';

/**
 * @class EmailPreferences
 * @extends {Component}
 */
class EmailPreferences extends PureComponent {
  /**
  * @constructor
  * @param {object} props from parent
  * @constructs EmailPreferences
  */
  constructor(props) {
    super(props);

    this.state = {
      message: '',
      transactionsPref: this.props.suppressionList.transactional,
      marketingPref: this.props.suppressionList.nontransactional,
    };

    this.toggleSubscription = this.toggleSubscription.bind(this);
    this.updateUserEmailPreferences = this.updateUserEmailPreferences.bind(this);

    this.toggleMarketingPref = this.toggleSubscription.bind(this, 'marketingPref');
    this.toggleTransactionalPref = this.toggleSubscription.bind(this, 'transactionsPref');
  }

  /**
   * toggleSubscriptions
   * @param {boolean} type the name of the property in state
   * @returns {boolean} boolean true or false
   */
  toggleSubscription(type) {
    this.setState({ [type]: !this.state[type] });
    this.updateUserEmailPreferences(type);
  }

  /**
   * updateUserEmailPreferences
   * @param {boolean} type the name of the property in state
   * @returns {null} carries out updating the user's email pref choice
   */
  async updateUserEmailPreferences(type) {
    const stateMap = { transactionsPref: 'transactional', marketingPref: 'non-transactional' };

    this.setState({ isLoading: true });
    await this.props.updateUserEmailPreferences(stateMap[type]);
    this.setState({ isLoading: false });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    if (!this.props.isUpdatingEmailPreferences) {
      return (
        <MaterialPanel
          height={100}
          style={{ shadowOffset: { width: 3, height: 3 } }}
          heading="Email Preferences"
          headingRight={this.props.isUpdatingEmailPreferences ? 'Cancel' : '...'}
          headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
          headerStyle={{ marginLeft: 10, color: GREY }}
          onPressHeadingRight={this.props.setEditEmailPreferences}
        />
      );
    }

    return (
      <MaterialPanel
        style={{ shadowOffset: { width: 3, height: 3 } }}
        heading="Email Preferences"
        headingRight={this.props.isUpdatingEmailPreferences ? 'Cancel' : '...'}
        headerRightStyle={{ color: Config.STUDIO_COLOR, marginRight: 10 }}
        headerStyle={{ marginLeft: 10, color: GREY }}
        onPressHeadingRight={this.props.setEditEmailPreferences}
      >
        <GiftedForm
          formName="emailPreferencesForm"
          clearOnClose
          style={{ backgroundColor: WHITE }}
          defaults={{
            purchaseReceiptsAndClassUpdates: !this.state.transactionsPref,
            specialOffersAndStudioNews: !this.state.marketingPref,
          }}
          scrollEnabled={false}
        >
          <GiftedForm.SwitchWidget
            name="purchaseReceiptsAndClassUpdates" // mandatory
            title="Purchase receipts and class updates"
            onTintColor={Config.STUDIO_COLOR}
            clearButtonMode="while-editing"
            onChange={this.toggleTransactionalPref}
            disabled={this.state.isLoading}
            value={!this.state.transactionsPref}
            widgetStyles={{
              rowContainer: {
                backgroundColor: WHITE,
                borderColor: WHITE,
              },
              switchTitle: {
                fontSize: 16,
                fontFamily: 'studio-font',
              },
            }}
          />

          <GiftedForm.SwitchWidget
            name="specialOffersAndStudioNews" // mandatory
            title="Special offers and studio news"
            clearButtonMode="while-editing"
            onTintColor={Config.STUDIO_COLOR}
            onChange={this.toggleMarketingPref}
            disabled={this.state.isLoading}
            value={!this.state.marketingPref}
            widgetStyles={{
              rowContainer: {
                backgroundColor: WHITE,
                borderColor: WHITE,
              },
              switchTitle: {
                fontSize: 16,
                fontFamily: 'studio-font',
              },
            }}
          />

          {this.state.message.length ? <View style={{ width: '100%', height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: Config.STUDIO_COLOR }}>{this.state.message}</Text>
          </View>
            : undefined}
        </GiftedForm>
      </MaterialPanel>
    );
  }
}

EmailPreferences.propTypes = {
  isUpdatingEmailPreferences: PropTypes.bool,
  setEditEmailPreferences: PropTypes.func,
  suppressionList: PropTypes.shape(),
  updateUserEmailPreferences: PropTypes.func,
};

const mapStateToProps = state => ({
  suppressionList: getUserSuppressionList(state),
});

const mapDispatchToProps = {
  updateUserEmailPreferences,
};

export default connect(mapStateToProps, mapDispatchToProps)(EmailPreferences);
