import React from 'react';
import { findNodeHandle } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import RAFCard from './RAFCard';
import RAFSummary from './RAFSummary';
import RAFResults from './RAFResults';
import RAFInput from './RAFInput';

import {
  getStudioName,
  getStudioCurrency,
  getFriendReferralAmountEarned,
  getAllFriendReferrals,
  getFriendReferralsLoading,
  getStudioRafAwardAmount,
} from '../../selectors';

import {
  requestFriendReferrals,
  sendFriendReferral,
} from '../../actions';

import Header from '../Header';
import { FadeInView } from '../shared';
import { ElevatedView } from '../styled';

/**
 * @class ReferAFriendPage
 * @extends {React.PureComponent}
 */
class ReferAFriendPage extends React.PureComponent {
  /**
   * @constructor
   * @constructs ReferAFriendPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.state = {
      shouldFocus: false,
    };

    this.toggleShouldFocus = this.toggleShouldFocus.bind(this);
    this.handleOnFocus = this.handleOnFocus.bind(this);
    this.scrollToInput = this.scrollToInput.bind(this);
  }
  /**
   * componentDidMount
   * @returns {undefined}
   */
  componentDidMount() {
    this.props.requestFriendReferrals();
  }
  /**
   * @returns {undefined}
   */
  toggleShouldFocus() {
    this.setState({ shouldFocus: !this.state.shouldFocus });
  }
  /**
   * @param {object} reactNode - the targeted node
   * @returns {undefined}
   */
  scrollToInput(reactNode) {
    this.scroll.props.scrollToFocusedInput(reactNode);
  }
  /**
   * @param {object} event = the event obj
   * @returns {undefined}
   */
  handleOnFocus(event) {
    this.scrollToInput(findNodeHandle(event.target));
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const currency = this.props.studioCurrency === 'USD' ? '$' : '£';
    return (
      <FadeInView>
        <Header title="Refer a Friend" />
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="always"
          resetScrollToCoords={{ x: 0, y: 0 }}
          extraScrollHeight={50}
          innerRef={(ref) => { this.scroll = ref; }}
        >
          <ElevatedView>
            <RAFCard
              totalReferralCredit={`${currency}${this.props.referralAmountEarned}`}
            />
            <RAFSummary
              earnedAmount={`${currency}${this.props.rafAwardAmount}`}
              studioName={this.props.studioName}
            />
            <RAFInput
              shouldFocus={this.state.shouldFocus}
              sendFriendReferral={this.props.sendFriendReferral}
              loading={this.props.loading}
              onFocusFunc={this.handleOnFocus}
            />
          </ElevatedView>
          <RAFResults
            referredFriends={this.props.referredFriends}
            currency={currency}
            toggleShouldFocus={this.toggleShouldFocus}
            earnedAmount={this.props.rafAwardAmount}
          />
        </KeyboardAwareScrollView>
      </FadeInView>
    );
  }
}

ReferAFriendPage.propTypes = {
  studioCurrency: PropTypes.string,
  studioName: PropTypes.string,
  referralAmountEarned: PropTypes.number,
  requestFriendReferrals: PropTypes.func,
  referredFriends: PropTypes.arrayOf(PropTypes.shape()),
  sendFriendReferral: PropTypes.func,
  rafAwardAmount: PropTypes.number,
  loading: PropTypes.bool,
};

const mapStateToProps = state => ({
  studioName: getStudioName(state),
  studioCurrency: getStudioCurrency(state),
  referralAmountEarned: getFriendReferralAmountEarned(state),
  referredFriends: getAllFriendReferrals(state),
  loading: getFriendReferralsLoading(state),
  rafAwardAmount: getStudioRafAwardAmount(state),
});

const mapDispatchToProps = {
  requestFriendReferrals,
  sendFriendReferral,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReferAFriendPage);

