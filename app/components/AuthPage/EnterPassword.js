import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Text,
  Button,
  TextInput,
  AsyncStorage,
} from 'react-native';
import styled from 'styled-components';
import { submitLogin } from '../../actions/UserActions';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

/**
 * @class EnterPassword
 * @extends Component
 */
class EnterPassword extends Component {
  /**
   * @constructor
   * @constructs EnterPassword
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      password: '',
    };
    this.handleOnPress = this.handleOnPress.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
  }

  /**
   * @returns {undefined}
   */
  handleOnPress() {
    const email = this.props.navigation.state.params.email;
    this.props.submitLogin(email, this.state.password);
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    return (
      <StyledView>
        <Text>What is your password?</Text>
        <TextInput
          placeholder="Password"
          secureTextEntry
          style={{ width: 150 }}
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <Button
          title="SUBMIT"
          onPress={this.handleOnPress}
        />
      </StyledView>
    );
  }
}

EnterPassword.propTypes = {
  navigation: PropTypes.shape(),
  submitLogin: PropTypes.func,
};

const mapDispatchToProps = {
  submitLogin,
};

export default connect(null, mapDispatchToProps)(EnterPassword);
