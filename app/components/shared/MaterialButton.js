import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Config from '../../../config.json';
import { lightenDarkenColor } from '../../helpers';

const StyledMaterial = styled.TouchableHighlight`
  align-items: center;
  background-color: ${Config.STUDIO_COLOR};
  border-radius: 5px;
  justify-content: center;
`;

const StyledText = styled.Text`
  color: #fff;
  font-family: 'flex-font';
  font-size: ${props => (props.fontSize || 16)};
`;

/**
 * @class MaterialButton
 * @extends {React.PureComponent}
 */
class MaterialButton extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <StyledMaterial
        underlayColor={lightenDarkenColor(Config.STUDIO_COLOR, 15)}
        {...this.props}
      >
        <StyledText fontSize={this.props.fontSize}>
          {this.props.text}
        </StyledText>
      </StyledMaterial>
    );
  }
}

MaterialButton.defaultProps = {
  fontSize: 16,
  style: {
    height: 50,
  },
};

const stringOrNum = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
]);

MaterialButton.propTypes = {
  style: PropTypes.shape(),
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  fontSize: stringOrNum,
};

export default MaterialButton;
