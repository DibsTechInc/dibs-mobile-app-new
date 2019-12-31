import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';

import Config from '../../../config.json';
import {
  WHITE,
  DARK_TEXT_GREY,
  LIGHT_GREY,
} from '../../constants';
import {
  getQueueHasMessages,
  getAlertTitle,
  getAlertMessage,
  getAlertButtons,
  getAlertInputValue,
  getAlertHasInput,
  getAlertInputPlaceholder,
} from '../../selectors';
import { setAlertInputValue, dequeueAlert } from '../../actions';
import { HeavyText, NormalText, FlexRow } from '../styled';
import { FadeInView, InputField } from '../shared';

const TouchableContainer = styled.TouchableOpacity`
  align-items: center;
  bottom: 0;
  justify-content: ${props => (props.showInput ? 'flex-start' : 'center')};
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const Title = styled(HeavyText)`
  color: ${DARK_TEXT_GREY};
  margin-bottom: 7;
  padding-horizontal: 10;
  padding-vertical: 10;
  text-align: center;
  margin-top: 10px;
`;

const Message = styled(NormalText)`
  border-color: ${LIGHT_GREY};
  border-bottom-width: 1;
  color: ${DARK_TEXT_GREY};
  margin-bottom: 15;
  padding-horizontal: 15;
  text-align: left;
`;

// const Border = styled.View`
//   background-color: ${LIGHT_GREY};
//   height: 1;
//   width: 100%;
// `;

const ButtonRow = styled(FlexRow)`
  justify-content: flex-end;
  width: 100%;
`;

const Button = styled.TouchableOpacity`
  margin-right: 10;
`;

const ButtonText = styled(HeavyText)`
  color: ${Config.STUDIO_COLOR};
  padding-horizontal: 10;
  padding-vertical: 15;
`;

/**
 * @class Modal
 * @extends {React.PureComponent}
 */
class Modal extends React.PureComponent {
  /**
   * @constructor
   * @constructs Modal
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.onBackgroundPress = this.onBackgroundPress.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  /**
   * @returns {undefined}
   */
  onBackgroundPress() {
    this.props.dequeueAlert();
  }
  /**
   * @param {Object} value of input
   * @returns {undefined}
   */
  onChange(value) {
    this.props.setAlertInputValue(value);
  }
  /**
   * render
   * @returns {JSX.Element} XML
   */
  render() {
    if (!this.props.queueHasMessages) return null;
    return (
      <FadeInView
        duration={100}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          flex: 1,
          right: 0,
          left: 0,
          position: 'absolute',
          top: 0,
          bottom: 0,
        }}
      >
        <TouchableContainer
          activeOpacity={1}
          onPress={this.onBackgroundPress}
          showInput={this.props.showInput}
        >
          <FadeInView
            duration={250}
            style={{
              alignItems: 'center',
              backgroundColor: WHITE,
              borderRadius: 5,
              flex: 0,
              marginTop: this.props.showInput ? 115 : 0,
              width: 250,
            }}
          >
            <Title>
              {this.props.title}
            </Title>
            {this.props.message ? (
              <Message>
                {this.props.message}
              </Message>
            ) : null}
            {this.props.showInput ? (
              <InputField
                onChangeText={this.onChange}
                value={this.props.inputValue}
                placeholder={this.props.placeholder}
                noNavigation
                containerStyle={{ width: 200, marginBottom: 10 }}
                autoFocus
                autoCapitalize="none"
              />
            ) : null}
            <ButtonRow>
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
            </ButtonRow>
          </FadeInView>
        </TouchableContainer>
      </FadeInView>
    );
  }
}

Modal.propTypes = {
  queueHasMessages: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  buttons: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  showInput: PropTypes.bool.isRequired,
  inputValue: PropTypes.string.isRequired,
  setAlertInputValue: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  dequeueAlert: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  queueHasMessages: getQueueHasMessages(state),
  title: getAlertTitle(state),
  message: getAlertMessage(state),
  buttons: getAlertButtons(state),
  inputValue: getAlertInputValue(state),
  showInput: getAlertHasInput(state),
  placeholder: getAlertInputPlaceholder(state),
});
const mapDispatchToProps = {
  setAlertInputValue,
  dequeueAlert,
};

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
