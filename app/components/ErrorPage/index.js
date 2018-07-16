import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Sentry from 'sentry-expo';

import Config from '../../../config.json';
import { WHITE, DARK_TEXT_GREY } from '../../constants';
import { logOutUser } from '../../actions';
import { FlexCenter, HeavyText, NormalText } from '../styled';

const Container = FlexCenter.extend`
  background: ${WHITE};
`;

const Heading = HeavyText.extend`
  color: ${Config.STUDIO_COLOR};
  font-size: 16;
  margin-bottom: 10;
`;

const Body = NormalText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 16;
  padding-horizontal: 20;
  text-align: center;
`;

/**
 * @class ErrorPage
 * @extends {React.PureComponent}
 */
class ErrorPage extends React.PureComponent {
  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    if (this.props.err.message === 'Not connected to the internet') return;
    Sentry.captureException(new Error(this.props.err.message), { logger: 'my.module' });
    await this.props.logOutUser();
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container>
        <Heading>
          Something went wrong.
        </Heading>
        <Body>
          An error occurred, but don&apos;t worry, our support team has been notified.
          Please close the app and reopen it. If the error persists, please reach out.
        </Body>
      </Container>
    );
  }
}

ErrorPage.propTypes = {
  err: PropTypes.shape(),
  logOutUser: PropTypes.func,
};

const mapStateToProps = state => ({
  err: state.alerts.fatalError,
});

const mapDispatchToProps = {
  logOutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(ErrorPage);
