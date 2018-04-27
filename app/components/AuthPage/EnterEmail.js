
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  StyleSheet,
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import styled from 'styled-components';

import { validateEmail } from '../../actions/UserActions';

const StyledView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

class EnterEmail extends Component {
  constructor() {
    super();

    this.state = {
      email: 'benjamin@ondibs.com',
    }
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if ((prevProps.authRoute !== this.props.authRoute) && this.state.email.length) {
  //     this.setState({
  //       email: '',
  //     });

  //     this.props.navigation.navigate(this.props.authRoute, { email: prevState.email });
  //   }
  // }

  handleOnPress(email) {
    this.props.validateEmail(email, () => {
      this.props.navigation.navigate(this.props.authRoute, { email });
    });
  }

  render() {
    return (
      <StyledView>
        <Text>What is your email?</Text>
        <TextInput
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <Button title="CONTINUE" accessibilityLabel="CONTINUE" onPress={this.handleOnPress.bind(this, this.state.email)} />
      </StyledView>
    );
  }
}

// refactor to selectors lataa
const mapStateToProps = state => ({
  authRoute: state.user.authStatusRoute
})

const mapDispatchToProps = {
  validateEmail
}

export default connect(mapStateToProps, mapDispatchToProps)(EnterEmail);
