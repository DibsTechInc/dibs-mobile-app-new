import React from 'react';
import styled from 'styled-components';

import { WHITE, TEXT_GREY } from '../../constants';
import Header from '../Header';
import { FadeInView, MaterialButton } from '../shared';

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
  goBack() { /* TODO */ }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView>
        <Header title="My Cart" />
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

NoItems.propTypes = {};

export default NoItems;
