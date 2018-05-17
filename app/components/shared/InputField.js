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
   * @constructor
   * @constructs InputField
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { focused: false };
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }
  /**
   * @returns {undefined}
   */
  onFocus() {
    this.setState({ focused: true });
    if (typeof this.props.onFocus === 'function') this.props.onFocus();
  }
  /**
   * @returns {undefined}
   */
  onBlur() {
    this.setState({ focused: false });
    if (typeof this.props.onBlur === 'function') this.props.onBlur();
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
        <StudioColorBottomBorder
          style={{
            ...this.props.containerStyle,
            borderBottomWidth: 1 + Boolean(this.state.focused),
          }}
        >
          {this.props.label ? (
            <Label style={this.props.labelStyle}>
              {this.props.label}
            </Label>
          ) : null}
          <View keyboardShouldPersistTaps="never">
            <DefaultInput
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              {...this.props}
            />
          </View>
        </StudioColorBottomBorder>
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
