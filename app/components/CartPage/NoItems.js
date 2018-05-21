import React from 'react';
import PropTypes from 'prop-types';
import { withNavigation } from 'react-navigation';
import styled from 'styled-components';

import Config from '../../../config.json';
import { WHITE, SCHEDULE_ROUTE, TEXT_GREY } from '../../constants';
import { FadeInView, CustomStatusBar, BackArrow, MaterialButton } from '../shared';
import { FlexRow, HeavyText } from '../styled';

const StudioColoredTop = FlexRow.extend`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  height: 80;
  justify-content: center;
  position: relative;
`;

const CartTitle = HeavyText.extend`
  color: ${WHITE};
  font-size: 16;
  text-align: center;
`;

const BackButtonContainer = styled.View`
  align-items: center;
  background: ${WHITE};
  padding-vertical: 30;
  width: 100%;
`;

const BodyText = styled.Text`
  color: ${TEXT_GREY};
  font-size: 14;
  font-family: 'flex-font';
  margin-bottom: 20;
`;

/**
 * @class NoItems
 * @extends {React.PureComponent}
 */
class NoItems extends React.PureComponent {
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
    this.props.navigation.navigate(SCHEDULE_ROUTE);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView>
        <CustomStatusBar backgroundColor={Config.STUDIO_COLOR} barStyle="light-content" />
        <StudioColoredTop>
          <BackArrow
            onPress={this.goBack}
            style={{
              left: 15,
              top: 25,
              position: 'absolute',
            }}
            stroke={WHITE}
          />
          <CartTitle>
            My Cart
          </CartTitle>
        </StudioColoredTop>
        <BackButtonContainer>
          <BodyText>
            Your cart is empty.
          </BodyText>
          <MaterialButton
            text="Back"
            onPress={this.goBack}
            style={{ width: 200, height: 40 }}
          />
        </BackButtonContainer>
      </FadeInView>
    );
  }
}

NoItems.propTypes = {
  navigation: PropTypes.shape().isRequired,
};

export default withNavigation(NoItems);
