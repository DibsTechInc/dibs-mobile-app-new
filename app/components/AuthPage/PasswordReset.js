import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { promisify } from 'bluebird';
import styled from 'styled-components';

import Config from '../../../config.json';
import { LANDING_ROUTE } from '../../constants';
import { getStudioDomain } from '../../selectors';
import { createPasswordResetLink } from '../../actions';
import { HeavyText, NormalText } from '../styled';
import { LinearLoader, MaterialButton, FadeInView } from '../shared';

const MessageContainer = styled.View`
  align-items: center;
`;

const Header = HeavyText.extend`
  color: ${Config.STUDIO_COLOR}
  margin-bottom: 15;
`;

const Message = NormalText.extend`
  text-align: center;
  width: 300;
`;

/**
 * @class PasswordReset
 * @extends {React.Component}
 */
class PasswordReset extends React.PureComponent {
  /**
   * @constructor
   * @constructs PasswordReset
   * @param {Object} props Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      success: null,
      message: null,
    };
    this.navigateToEnterLanding = this.navigateToEnterLanding.bind(this);
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
      const { success, message } = await promisify(this.props.createPasswordResetLink)(this.props.navigation.state.params.email);
      await promisify(this.setState.bind(this))({ loading: false, success, message });
    } catch (err) {
      this.setState({ success: false, message: 'Something went wrong sending your password reset link.' });
    }
  }
  /**
   * @returns {undefined}
   */
  navigateToEnterLanding() {
    this.props.navigation.navigate(LANDING_ROUTE);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const successMessage = `An email was sent to ${this.props.navigation.state.params.email} with instructions to reset your password at ${this.props.studioDomain}.`;
    return (
      <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
        {this.state.loading ? (
          <LinearLoader color={Config.STUDIO_COLOR} />
        ) : (
          <MessageContainer>
            <Header>
              {this.state.success ? 'Password Reset Link Sent!' : 'Uh oh!'}
            </Header>
            <Message>
              {this.state.success ? successMessage : this.state.message}
            </Message>
            <MaterialButton
              text="Sign In"
              style={{ height: 40, width: 120, marginTop: 25 }}
              onPress={this.navigateToEnterLanding}
            />
          </MessageContainer>
        )}
      </FadeInView>
    );
  }
}

PasswordReset.propTypes = {
  navigation: PropTypes.shape().isRequired,
  studioDomain: PropTypes.string.isRequired,
  createPasswordResetLink: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  studioDomain: getStudioDomain(state),
});
const mapDispatchToProps = {
  createPasswordResetLink,
};

export default connect(mapStateToProps, mapDispatchToProps)(PasswordReset);
