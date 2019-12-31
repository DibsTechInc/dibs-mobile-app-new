import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { ScrollView } from 'react-native';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';

import { DEFAULT_BG } from '../../../constants';
import { FlexRow } from '../../styled';
import { MaterialButton, FadeInView, InputField } from '../../shared';

const ButtonContainer = styled(FlexRow)`
  align-items: center;
  justify-content: center;
  padding: 8px;
`;

/**
 * @class EnterCode
 * @extends {React.PureComponent}
 */
class EnterCode extends React.PureComponent {
  /**
   * @constructor
   * @constructs EnterCode
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { code: '' };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }
  /**
   * @param {string} value user entered
   * @returns {undefined}
   */
  onChange(value) {
    this.setState({ code: value });
  }
  /**
   * @returns {undefined}
   */
  onSubmit() {
    this.props.onSubmit(this.state.code);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView>
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', height: '70%', position: 'relative' }}
        >
          <InputField
            autoFocus
            onChangeText={this.onChange}
            label={`Please enter the code sent to your ${this.props.userHasMobilephone ? 'phone' : 'email'}.`}
            returnKeyType="send"
            keyboardType="numeric"
            value={this.state.code}
            containerStyle={{ marginBottom: 10, width: 200, minWidth: 200, alignItems: 'center' }}
            labelStyle={{ marginBottom: 20, textAlign: 'center' }}
            style={{ fontSize: 16 }}
            onSubmitEditing={this.onSubmit}
          />
        </ScrollView>
        <KeyboardAccessoryView
          alwaysVisible
          hideBorder
          style={{ backgroundColor: DEFAULT_BG, marginBottom: 25 }}
        >
          <ButtonContainer>
            <MaterialButton
              onPress={this.onSubmit}
              text="Submit"
              style={{ width: '75%', height: 40 }}
            />
          </ButtonContainer>
        </KeyboardAccessoryView>
      </FadeInView>
    );
  }
}

EnterCode.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  userHasMobilephone: PropTypes.bool.isRequired,
};

export default EnterCode;
