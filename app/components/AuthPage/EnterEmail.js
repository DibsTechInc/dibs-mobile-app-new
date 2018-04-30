
import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import {
  // StyleSheet,
  // View,
  Text,
  Button,
  TextInput,
} from 'react-native';
// import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';

import { validateEmail } from '../../actions/UserActions';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

/**
 * @class EnterEmail
 * @extends Component
 */
class EnterEmail extends Component {
  /**
   * @constructor
   * @constructs EnterEmail
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      email: '',
    };
    this.handleOnPress = this.handleOnPress.bind(this);
  }

  /**
   * @param {string} email to verify
   * @returns {undefined}
   */
  async handleOnPress() {
    const { email } = this.state;
    const route = await new Promise(res => this.props.validateEmail(email, res));
    if (route) this.props.navigation.navigate(route, { email });
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView>
        <Text> What is your email? </Text>
        <TextInput
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <Button
          title="CONTINUE"
          accessibilityLabel="CONTINUE"
          onPress={this.handleOnPress}
        />
      </StyledView>
    );
  }
}

EnterEmail.propTypes = {
  navigation: PropTypes.shape(),
};

const mapDispatchToProps = {
  validateEmail,
};

export default connect(null, mapDispatchToProps)(EnterEmail);
