import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, View } from 'react-native';
import { StudioColorBottomBorder, DefaultInput, HeavyText } from '../styled';

const Label = HeavyText.extend`
  margin-bottom: 5;
`;

/**
 * @class InputField
 * @extends {React.PureComponent}
 */
class InputField extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View>
        <StudioColorBottomBorder style={this.props.containerStyle}>
          {this.props.label ? (
            <Label style={this.props.labelStyle}>
              {this.props.label}
            </Label>
          ) : null}
          <DefaultInput
            autoFocus
            {...this.props}
          />
        </StudioColorBottomBorder>
      </View>
    );
  }
}

InputField.defaultProps = {
  containerStyle: {},
  labelStyle: {},
};

InputField.propTypes = {
  ...TextInput.propTypes,
  label: PropTypes.string,
  containerStyle: PropTypes.shape(),
  labelStyle: PropTypes.shape(),
};

export default InputField;
