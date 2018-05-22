import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { withNavigation } from 'react-navigation';

import { WHITE, TEXT_GREY } from '../../constants';
import Header from '../Header';
import { FadeInView, MaterialButton } from '../shared';
import { NormalText } from '../styled';

const BackButtonContainer = styled.View`
  align-items: center;
  background: ${WHITE};
  padding-vertical: 30;
  width: 100%;
`;

const BodyText = NormalText.extend`
  color: ${TEXT_GREY};
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
    if (
      this.props.navigation.state.params
      && this.props.navigation.state.params.previousRoute
    ) return this.props.navigation.navigate(this.props.navigation.state.params.previousRoute);
    return this.props.navigation.goBack();
  }
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

NoItems.propTypes = {
  navigation: PropTypes.shape(),
};

export default withNavigation(NoItems);
