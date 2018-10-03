import React from 'react';
import PropTypes from 'prop-types';
import { promisify } from 'bluebird';
import { connect } from 'react-redux';

import Config from '../../../../config.json';
import {
  createPasswordReset,
  submitPasswordResetCode,
  submitPasswordReset,
  setUserResettingPassword,
} from '../../../actions';
import { FadeInView, LinearLoader } from '../../shared';

import EnterCode from './EnterCode';
import NewPassword from './NewPassword';
import { MAIN_ROUTE, LANDING_ROUTE } from '../../../constants/index';

/**
 * @class PasswordReset
 * @extends {React.PureComponent}
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
      userHasMobilephone: false,
      uuId: null,
    };
    this.setStateAsync = promisify(this.setState.bind(this));
    this.submitPasswordResetCode = this.submitPasswordResetCode.bind(this);
    this.submitNewPassword = this.submitNewPassword.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.createResetLink();
    this.props.setUserResettingPassword(true);
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    this.props.setUserResettingPassword(false);
  }
  /**
   * @returns {undefined}
   */
  async createResetLink() {
    const { userHasMobilephone } = await this.props.createPasswordReset(this.props.navigation.state.params.email);
    await this.setStateAsync({
      loading: false,
      userHasMobilephone: Boolean(userHasMobilephone),
    });
  }
  /**
   * @param {string} code user is attempting to submit
   * @returns {undefined}
   */
  async submitPasswordResetCode(code) {
    await this.setStateAsync({ loading: true });
    const uuId = await this.props.submitPasswordResetCode(code, this.props.navigation.state.params.email);
    await this.setStateAsync({ uuId, loading: false });
  }
  /**
   * @param {string} newPassword to submit
   * @returns {undefined}
   */
  async submitNewPassword(newPassword) {
    await this.setStateAsync({ loading: true });
    const success = await this.props.submitPasswordReset(this.state.uuId, newPassword);
    if (success) return this.props.navigation.navigate(MAIN_ROUTE);
    return this.props.navigation.navigate(LANDING_ROUTE);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (this.state.loading) {
      return (
        <FadeInView style={{ justifyContent: 'center', alignItems: 'center' }}>
          <LinearLoader color={Config.STUDIO_COLOR} />
        </FadeInView>
      );
    }
    if (this.state.uuId) {
      return (
        <NewPassword
          onSubmit={this.submitNewPassword}
        />
      );
    }
    return (
      <EnterCode
        onSubmit={this.submitPasswordResetCode}
        userHasMobilephone={this.state.userHasMobilephone}
      />
    );
  }
}

PasswordReset.propTypes = {
  navigation: PropTypes.shape().isRequired,
  createPasswordReset: PropTypes.func.isRequired,
  submitPasswordResetCode: PropTypes.func.isRequired,
  submitPasswordReset: PropTypes.func.isRequired,
  setUserResettingPassword: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  createPasswordReset,
  submitPasswordResetCode,
  submitPasswordReset,
  setUserResettingPassword,
};

export default connect(null, mapDispatchToProps)(PasswordReset);
