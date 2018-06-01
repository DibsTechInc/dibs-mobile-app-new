import React from 'react';
import { withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';
import { TextInput } from 'react-native';
import { StudioColorBottomBorder, HeavyText } from '../styled';

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
  componentDidMount() {
    if (this.props.customFocus) this.focusListener = this.props.navigation.addListener('didFocus', () => this.textInput.focus());
  }

  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.focusListener) this.focusListener.remove();
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
          <Label style={{
            ...this.props.labelStyle,
            fontFamily: 'flex-font',
            fontSize: 16,
          }}
          >
            {this.props.label}
          </Label>
        ) : null}
        <TextInput
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          ref={ref => this.textInput = ref}
          style={{
            ...this.props.inputStyle,
            fontFamily: 'flex-font',
            fontSize: 16,
          }}
          {...this.props}
        />
      </StudioColorBottomBorder>
    );
  }
}

InputField.defaultProps = {
  containerStyle: {},
  labelStyle: {},
  customFocus: false,
};

InputField.propTypes = {
  ...TextInput.propTypes,
  label: PropTypes.string,
  containerStyle: PropTypes.shape(),
  labelStyle: PropTypes.shape(),
  customFocus: PropTypes.bool,
  inputStyle: PropTypes.shape(),
  noNavigation: PropTypes.bool,
};

const InputFieldWithContext = withNavigation(InputField);

export default ({ noNavigation, ...props }) =>
  (noNavigation ?
    <InputField {...props} />
    : <InputFieldWithContext {...props} />);
