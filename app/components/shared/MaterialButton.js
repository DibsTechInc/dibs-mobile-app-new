import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { WHITE } from '../../constants';
import Config from '../../../config.json';
import { lightenDarkenColor } from '../../helpers';

const StyledMaterial = styled.TouchableHighlight`
  align-items: center;
  background-color: ${props => props.backgroundColor};
  border-radius: ${props => props.borderRadius};
  justify-content: center;
`;

const StyledText = styled.Text`
  color: ${props => props.textColor};
  font-family: 'flex-font';
  font-size: ${props => props.fontSize};
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
    const underlayColor = lightenDarkenColor(this.props.backgroundColor, 15);
    return (
      <StyledMaterial
        {...this.props}
        underlayColor={underlayColor}
      >
        <StyledText
          fontSize={this.props.fontSize}
          textColor={this.props.textColor}
          style={this.props.textStyle}
        >
          {this.props.text}
        </StyledText>
      </StyledMaterial>
    );
  }
}

MaterialButton.defaultProps = {
  fontSize: 14,
  style: {
    height: 50,
  },
  disabled: false,
  backgroundColor: Config.STUDIO_COLOR,
  textColor: WHITE,
  borderRadius: '5px',
};

const stringOrNum = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
]).isRequired;

MaterialButton.propTypes = {
  style: PropTypes.shape(),
  textStyle: PropTypes.shape(),
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  fontSize: stringOrNum,
  disabled: PropTypes.bool,
  backgroundColor: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
};

export default MaterialButton;
