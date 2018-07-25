import React from 'react';
import PropTypes from 'prop-types';

import RAFResultsRow from './RAFResultsRow';

import { ElevatedView } from '../styled';
import { SOLD_OUT_GREY, DARK_TEXT_GREY } from '../../constants';

import Config from '../../../config.json';

/**
 * @class RAFResults
 * @extends {React.PureComponent}
 */
class RAFResults extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const referredResults = this.props.referredFriends.map((referred) => {
      const creditsAwarded = referred.creditsAwarded ? referred.creditsAwarded : 5;
      const result = `${this.props.currency}${creditsAwarded} ${referred.referredTransactionId ? 'earned' : 'pending'}`;
      const resultColor = referred.referredTransactionId ? Config.STUDIO_COLOR : SOLD_OUT_GREY;
      return (
        <RAFResultsRow
          key={referred.id}
          leftText={referred.email}
          rightText={result}
          rightTextColor={resultColor}
          leftTextColor={DARK_TEXT_GREY}
          earned={Boolean(referred.referredTransactionId)}
        />);
    });

    return (
      <ElevatedView noPadding>
        <RAFResultsRow
          isHeader
          leftText="Referral"
          rightText="Status"
          leftTextColor={DARK_TEXT_GREY}
          rightTextColor={DARK_TEXT_GREY}
        />
        {referredResults}
        <RAFResultsRow
          hasLink
          leftText="Invite a friend"
          rightText={`Earn ${this.props.currency}${this.props.earnedAmount}`}
          leftTextColor={Config.STUDIO_COLOR}
          rightTextColor={SOLD_OUT_GREY}
          toggleShouldFocus={this.props.toggleShouldFocus}
        />
      </ElevatedView>
    );
  }
}

RAFResults.propTypes = {
  earnedAmount: PropTypes.number,
  referredFriends: PropTypes.arrayOf(PropTypes.shape()),
  currency: PropTypes.string,
  toggleShouldFocus: PropTypes.func,
};

export default RAFResults;
