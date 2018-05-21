import React from 'react';
import PropTypes from 'prop-types';
import { withNavigation } from 'react-navigation';
import { View } from 'react-native';

import Config from '../../../config.json';
import { WHITE, SCHEDULE_ROUTE, CART_ROUTE } from '../../constants';
import { FlexRow, HeavyText } from '../styled';
import { BackArrow, CustomStatusBar, CartIcon } from '../shared';

const StudioColoredTop = FlexRow.extend`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  height: 80;
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
    if (this.props.navigation.state.params && this.props.navigation.state.params.previousRoute) {
      this.props.navigation.navigate(this.props.navigation.state.params.previousRoute);
    }
    this.props.navigation.goBack();
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View>
        <CustomStatusBar backgroundColor={Config.STUDIO_COLOR} barStyle="light-content" />
        <StudioColoredTop>
          <BackArrow
            onPress={this.goBack}
            style={{ marginLeft: 15 }}
            stroke={WHITE}
          />
          <PageTitle>
            {this.props.title}
          </PageTitle>
          <CartIcon iconColor={WHITE} />
        </StudioColoredTop>
      </View>
    );
  }
}

Header.propTypes = {
  navigation: PropTypes.shape(),
  title: PropTypes.string.isRequired,
};

export default withNavigation(Header);
