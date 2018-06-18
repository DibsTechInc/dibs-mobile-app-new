import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';
import styled from 'styled-components';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

/**
 * @class About
 * @extends Component
 */
class About extends Component {
  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView>
        <Text>About {this.props.studioName} - Placeholder</Text>
        <Text>Custom text / images / image background</Text>
      </StyledView>
    );
  }
}

About.propTypes = {
  studioName: PropTypes.string,
};
