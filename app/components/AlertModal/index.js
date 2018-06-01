import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { View } from 'react-native';

import Config from '../../../config.json';
import {
  WHITE,
  DARK_TEXT_GREY,
} from '../../constants';
import {
  getQueueHasMessages,
  getAlertTitle,
  getAlertMessage,
  getAlertButtons,
} from '../../selectors';
import { HeavyText, NormalText, FlexRow } from '../styled';
import { FadeInView } from '../shared';

const Title = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  margin-bottom: 7;
  text-align: center;
`;

const Message = NormalText.extend`
  color: ${DARK_TEXT_GREY};
  text-align: center;
`;

const Button = styled.TouchableOpacity`
  padding-horizontal: 10;
  padding-top: 10;
  padding-bottom: 5;
`;

const ButtonText = HeavyText.extend`
  color: ${Config.STUDIO_COLOR};
`;

/**
 * @class AlertModal
 * @extends {React.PureComponent}
 */
class AlertModal extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    if (!this.props.queueHasMessages) return null;
    return (
      <FadeInView
        duration={200}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          flex: 1,
          right: 0,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          top: 0,
          bottom: 0,
        }}
      >
        <View
          style={{
            backgroundColor: WHITE,
            borderRadius: 5,
            padding: 10,
            width: 200,
          }}
        >
          <Title>
            {this.props.title}
          </Title>
          <Message>
            {this.props.message}
          </Message>
          <FlexRow style={{ justifyContent: 'space-around' }}>
            {this.props.buttons.map(({ onPress, text }) => (
              <Button
                key={text}
                onPress={onPress}
                activeOpacity={1}
              >
                <ButtonText>
                  {text}
                </ButtonText>
              </Button>
            ))}
          </FlexRow>
        </View>
      </FadeInView>
    );
  }
}

AlertModal.propTypes = {
  queueHasMessages: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  buttons: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  queueHasMessages: getQueueHasMessages(state),
  title: getAlertTitle(state),
  message: getAlertMessage(state),
  buttons: getAlertButtons(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(AlertModal);
