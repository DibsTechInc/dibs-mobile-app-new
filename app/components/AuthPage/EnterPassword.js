import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import styled from 'styled-components';
import { userLogin } from '../../actions/UserActions';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

class EnterPassword extends Component {
  constructor() {
    super();

    this.state = {
      password: '123',
    }
  }

  handleOnPress(password) {
    const email = this.props.navigation.state.params.email;

    // in progress
    this.props.userLogin(email, password);
    // this.props.navigation.navigate('Main');
  }

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
        <Button title="SUBMIT" onPress={this.handleOnPress.bind(this, this.state.password)} />
      </StyledView>
    );
  }
}

// add propTypes

const mapDispatchToProps = {
  userLogin,
}

export default connect(null, mapDispatchToProps)(EnterPassword);
