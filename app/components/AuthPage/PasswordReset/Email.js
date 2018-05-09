import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withNavigation } from 'react-navigation';
import { promisify } from 'bluebird';
import { LOGIN_ROUTE } from '../../../constants';
import { createPasswordResetLink } from '../../../actions';
import { getStudioDomain } from '../../../selectors';
import Config from '../../../../config.json';
import DibsLoader from '../../shared/DibsLoader';
import { HeavyText } from '../../styled';
import MaterialButton from '../../shared/MaterialButton';

const Container = styled.View`
  align-items: center;
`;

const Header = HeavyText.extend`
  color: ${Config.STUDIO_COLOR}
  margin-bottom: 15;
`;

const Message = styled.Text`
  font-family: flex-font;
  text-align: center;
`;

/**
 * @class Email
 * @extends {React.Component}
 */
class Email extends React.Component {
  /**
   * @constructor
   * @constructs Email
   * @param {Object} props Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      success: null,
      message: null,
    };
    this.navigateToEnterPassword = this.navigateToEnterPassword.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.createResetLink();
  }
  /**
   * @returns {undefined}
   */
  async createResetLink() {
    try {
      const { success, message } = await promisify(this.props.createPasswordResetLink)(this.props.email);
      await promisify(this.setState.bind(this))({ loading: false, success, message });
    } catch (err) {
      this.setState({ success: false, message: 'Something went wrong sending your password reset link.' });
    }
  }
  /**
   * @returns {undefined}
   */
  navigateToEnterPassword() {
    this.props.navigation.navigate(LOGIN_ROUTE, { email: this.props.email });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (this.state.loading) {
      return (
        <DibsLoader dotColor={Config.STUDIO_COLOR} />
      );
    }
    const successMessage = `An email was sent to ${this.props.email} with instructions to reset your password at ${this.props.studioDomain}.`;
    return (
      <Container>
        <Header>
          {this.state.success ? 'Password Reset Link Sent!' : 'Uh oh!' }
        </Header>
        <Message>
          {this.state.success ? successMessage : this.state.message}
        </Message>
        <MaterialButton
          text="Log in"
          style={{ height: 40, width: 120, marginTop: 25 }}
          onPress={this.navigateToEnterPassword}
        />
      </Container>
    );
  }
}

Email.propTypes = {
  createPasswordResetLink: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  studioDomain: PropTypes.string.isRequired,
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
  studioDomain: getStudioDomain(state),
});
const mapDispatchToProps = { createPasswordResetLink };

export default compose(
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps)
)(Email);
