import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { DARK_TEXT_GREY } from '../../constants';
import { MaterialPanelView } from '../styled';

const Heading = styled.Text`
  color: ${DARK_TEXT_GREY};
  font-size: 16px;
  font-family: 'flex-font-heavy';
  margin-bottom: 15px;
`;

/**
 * @class MaterialPanel
 * @extends {React.PureComponent}
 */
class MaterialPanel extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <MaterialPanelView height={this.props.height} style={this.props.style}>
        {this.props.heading && (
          <Heading style={this.props.headerStyle}>
            {this.props.heading}
          </Heading>
        )}
        {this.props.children}
      </MaterialPanelView>
    );
  }
}

MaterialPanel.propTypes = {
  height: PropTypes.number,
  style: PropTypes.shape(),
  headerStyle: PropTypes.shape(),
  heading: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
};

export default MaterialPanel;
