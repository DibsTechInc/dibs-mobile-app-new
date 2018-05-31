import React from 'react';
import PropTypes from 'prop-types';
import { withNavigation } from 'react-navigation';
import { View } from 'react-native';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Config from '../../../config.json';
import { WHITE } from '../../constants';
import { setUpcomingEventSliderExpandedFalse } from '../../actions';
import { FlexRow, HeavyText } from '../styled';
import { BackArrow, CustomStatusBar, CartIcon, XIcon } from '../shared';

const StudioColoredTop = FlexRow.extend`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  height: ${60 + (isIphoneX() ? 30 : 0)};
  justify-content: space-between;
`;

const PageTitle = HeavyText.extend`
  color: ${WHITE};
  font-size: 16;
  text-align: center;
`;

/**
 * @class Header
 * @extends {React.PureComponent}
 */
class Header extends React.PureComponent {
  /**
   * @constructor
   * @constructs NoItems
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
  }
  /**
   * @returns {undefined}
   */
  goBack() {
    if (
      this.props.navigation.state.params
      && this.props.navigation.state.params.previousRoute
    ) return this.props.navigation.navigate(this.props.navigation.state.params.previousRoute);
    return this.props.navigation.goBack();
  }
  /**
   * @returns {JSX.Element} XML
   */
  render() {
    return (
      <View style={{ height: 80 + (isIphoneX() ? 20 : 0), overflow: 'hidden' }}>
        <CustomStatusBar backgroundColor={Config.STUDIO_COLOR} barStyle="light-content" />
        <StudioColoredTop>
          <View style={{ width: 60 }}>
            {this.props.upcomingEventSliderExpanded || this.props.isSliderHeader ? (
              <View style={{ width: 30, marginLeft: 15 }}>
                <XIcon
                  onPress={this.props.setUpcomingEventSliderExpandedFalse}
                  stroke={WHITE}
                  strokeWidth={2.5}
                  size={18}
                />
              </View>
            ) : (
              <BackArrow
                onPress={this.goBack}
                style={{ marginLeft: 15 }}
                stroke={WHITE}
                strokeWidth={2.5}
              />
            )}
          </View>
          <PageTitle>
            {this.props.title}
          </PageTitle>
          <View style={{ width: 60 }}>
            <CartIcon iconColor={WHITE} />
          </View>
        </StudioColoredTop>
      </View>
    );
  }
}

Header.defaultProps = {
  title: '',
  isSliderHeader: false,
};

Header.propTypes = {
  navigation: PropTypes.shape().isRequired,
  title: PropTypes.string,
  upcomingEventSliderExpanded: PropTypes.bool.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
  isSliderHeader: PropTypes.bool,
};

const mapStateToProps = state => ({
  upcomingEventSliderExpanded: state.animation.upcomingEventSliderExpanded,
});
const mapDispatchToProps = {
  setUpcomingEventSliderExpandedFalse,
};

export default compose(
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps)
)(Header);
