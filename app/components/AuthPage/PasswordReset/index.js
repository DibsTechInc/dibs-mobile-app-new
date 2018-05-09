import React from 'react';
// import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FlexCenter } from '../../styled';
import EmailOption from './Email';

const PasswordResetPrefence = {
  NotSelected: 0,
  Email: 1,
  SMS: 2,
};

const Container = FlexCenter.extend`
  flex: 2;
  width: 100%;
`;

/**
 * @class PasswordReset
 * @extends {React.Component}
 */
class PasswordReset extends React.Component {
  /**
   * @constructor
   * @constructs PasswordReset
   * @param {Object} props Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      preference: PasswordResetPrefence[props.navigation.state.params.openTo || 'NotSelected'],
    };
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container>
        {this.state.preference === PasswordResetPrefence.Email ? (
          <EmailOption email={this.props.navigation.state.params.email} />
        ) : null}
      </Container>
    );
  }
}

PasswordReset.propTypes = {
  navigation: PropTypes.shape(),
};

export default PasswordReset;
