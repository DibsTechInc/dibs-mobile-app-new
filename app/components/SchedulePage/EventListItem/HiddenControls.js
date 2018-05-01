import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Config from '../../../../config.json';

const StyledHiddenItemView = styled.View`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  padding-right: 40;
  padding-left: 40;
`;

const StyledHiddenItemText = styled.Text`
  color: #fff;
  justify-content: center;
  font-family: 'flex-font-heavy';
`;

/**
 * @classHiddenControls
 * @extends {React.PureComponent}
 */
class HiddenControls extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <StyledHiddenItemView>
        <StyledHiddenItemText>
          Drop class
        </StyledHiddenItemText>
        <StyledHiddenItemText>
          Add to cart
        </StyledHiddenItemText>
      </StyledHiddenItemView>
    );
  }
}

HiddenControls.propTypes = {};

export default HiddenControls;
