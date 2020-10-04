import React from 'react';
import PropTypes from 'prop-types';
import Sentry from 'sentry-expo';
import { connect } from 'react-redux';
import { Updates } from 'expo';
import styled from 'styled-components';

import Config from '../../../config.json';

import { WHITE, DARK_TEXT_GREY } from '../../constants';
import { FlexCenter, HeavyText, NormalText } from '../styled';
import { MaterialButton } from '../shared';

const Container = styled(FlexCenter)`
  background: ${WHITE};
`;

const Heading = styled(HeavyText)`
  color: ${Config.STUDIO_COLOR};
  font-size: 16;
  margin-bottom: 10;
`;

const Body = styled(NormalText)`
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
   * @constructor
   * @constructs ErrorPage
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.handleOnPress = this.handleOnPress.bind(this);
  }
  /**
   * @returns {undefined}
   */
  async componentDidMount() {
    if (this.props.err.message === 'Not connected to the internet') return;
    Sentry.captureException(new Error(this.props.err.message), { logger: 'my.module' });
  }
  /**
   * @returns {undefined}
   */
  handleOnPress() {
    Updates.reload();
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
        </Body>
        <MaterialButton
          onPress={this.handleOnPress}
          text="Reload Application"
          style={{ width: '50%', height: 40, marginTop: 20 }}
        />
      </Container>
    );
  }
}

ErrorPage.propTypes = {
  err: PropTypes.shape(),
};

const mapStateToProps = state => ({
  err: state.alerts.fatalError,
});


export default connect(mapStateToProps)(ErrorPage);
