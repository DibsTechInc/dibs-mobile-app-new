import React from 'react';
import { connect } from 'react-redux';
import { View, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Header from '../Header';
import PackageItem from '../shared/PackageItem';
import CreditLoadItem from '../shared/CreditLoadItem';

import { FadeInView } from '../shared';
import { WHITE, LIGHT_GREY } from '../../constants';
import { getDetailedStudioPackages, getDetailedStudioCreditTiers, getStudioShowsCredits } from '../../selectors';
import { NormalText, HeavyText } from '../styled';

import Config from '../../../config.json';

const NoticeContainer = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: ${WHITE},
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  overflow: hidden;
  padding-top: 40;
  padding-left: 25;
  padding-right: 25;
  position: relative;
`;

const ScrollContainer = styled.ScrollView`
  background: ${WHITE};
  margin-top: 1px;
`;

const IPhoneXPadding = styled.View`
  background: ${WHITE};
  height: ${Number(isIphoneX()) * 25};
  width: 100%;
`;

/**
 * @class PackagesPage
 * @extends {React.PureComponent}
 */
class BuyItemsPage extends React.PureComponent {
  /**
   * @constructor
   * @constructs PackagesPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.state = {
      showPackageNotice: true,
    };

    this.handleOnPressCloseNotice = this.handleOnPressCloseNotice.bind(this);
  }
  /**
   * @returns {undefined}
   */
  handleOnPressCloseNotice() {
    this.setState({
      showPackageNotice: false,
    });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const showNoticeContainer = this.state.showPackageNotice ? (<NoticeContainer>
      <NormalText>
        If you book a class on the schedule that is lower than your class package price, you will earn the difference back in credit to your account.
      </NormalText>
      <View style={{ height: 50, width: '100%' }}>
        <TouchableOpacity onPress={this.handleOnPressCloseNotice}>
          <HeavyText style={{ textAlign: 'right', marginTop: 10, color: Config.STUDIO_COLOR }}>
            DISMISS
          </HeavyText>
        </TouchableOpacity>
      </View>
    </NoticeContainer>):undefined;

    return (
      <FadeInView>
        <Header title={this.props.showCreditTiers ? 'Credits & Packages' : 'Packages'} />
        {showNoticeContainer}
        <ScrollContainer>
          {this.props.showCreditTiers &&
            this.props.creditTiers.map(creditTier => (
              <CreditLoadItem
                key={creditTier.id}
                {...creditTier}
              />
            ))}
          {this.props.packages.map(pkg => (
            <PackageItem
              key={pkg.id}
              {...pkg}
            />
          ))}
        </ScrollContainer>
        <IPhoneXPadding />
      </FadeInView>
    );
  }
}

BuyItemsPage.propTypes = {
  packages: PropTypes.arrayOf(PropTypes.shape()),
  creditTiers: PropTypes.arrayOf(PropTypes.shape()),
  showCreditTiers: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  packages: getDetailedStudioPackages(state),
  creditTiers: getDetailedStudioCreditTiers(state),
  showCreditTiers: getStudioShowsCredits(state),
});

export default connect(mapStateToProps)(BuyItemsPage);
