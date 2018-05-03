import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { WHITE, RED } from '../../constants';

const StyledView = styled.View`
  position: relative;
`;

// default props are from the use case
// i abstracted this out of

const StyledNotification = styled.View`
  justify-content: center;
  align-items: center;
  background-color: ${props => props.backgroundColor};
  z-index: 1;
  border-radius: ${props => props.radius};
  margin-right: ${props => props.marginRight};
  width: ${props => (2 * props.radius)};
  height: ${props => (2 * props.radius)};
  position: absolute;
  right: ${props => props.right};
  top: ${props => props.top};
`;

const StyledNotificationText = styled.Text`
  font-family: flex-font;
  font-size: ${props => props.fontSize};
  color: ${props => props.notificationTextColor};
`;

/**
 * @class Notification
 * @extends PureComponent
 */
export default class Notification extends React.PureComponent {
  /**
 * @returns {JSX} XML
 */
  render() {
    if (!this.props.notificationCount) return this.props.children;
    return (
      <StyledView>
        <StyledNotification {...this.props}>
          <StyledNotificationText {...this.props}>
            {this.props.notificationCount}
          </StyledNotificationText>
        </StyledNotification>
        {this.props.children}
      </StyledView>
    );
  }
}

Notification.defaultProps = {
  backgroundColor: RED,
  fontSize: '12px',
  height: 20,
  marginRight: 5,
  notificationTextColor: WHITE,
  radius: 10,
  right: 7,
  top: 10,
  width: 20,
};

Notification.propTypes = {
  notificationCount: PropTypes.number,
  backgroundColor: PropTypes.string,
  notificationTextColor: PropTypes.string,
  radius: PropTypes.number,
  fontSize: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  children: PropTypes.element,
};
