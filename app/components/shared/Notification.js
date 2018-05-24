import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { View, Animated } from 'react-native';

import { WHITE, RED } from '../../constants';
import { NormalText } from '../styled';

const RelativeView = styled.View`
  position: relative;
`;

const notificationStyle = props => ({
  alignItems: 'center',
  backgroundColor: props.backgroundColor,
  borderRadius: props.radius,
  justifyContent: 'center',
  height: 2 * props.radius,
  marginRight: props.marginRight,
  position: 'absolute',
  right: props.right,
  top: props.top,
  width: 2 * props.radius,
  zIndex: 1,
});

const NotificationText = NormalText.extend`
  font-size: ${props => props.fontSize};
  color: ${props => props.notificationTextColor};
`;

const getRadiusValue = (radius, animValue) => Animated.add(radius, Animated.multiply(radius, animValue));
const getDiameterValue = (radius, animValue) => Animated.multiply(2, getRadiusValue(radius, animValue));
const getPositionValue = (pos, radius, animValue) => Animated.add(pos, Animated.multiply(-radius, animValue));

/**
 * @class Notification
 * @extends PureComponent
 */
export default class Notification extends React.PureComponent {
  /**
   * @constructor
   * @constructs Notification
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { showPulse: false, animValue: new Animated.Value(0) };
  }
  /**
   * @param {Object} props component will receive
   * @returns {undefined}
   */
  async componentWillReceiveProps(props) {
    if (props.notificationCount && props.notificationCount !== this.props.notificationCount) {
      await new Promise(res => this.setState({ showPulse: true }, res));
      await new Promise(res => Animated.timing(
        this.state.animValue,
        {
          toValue: 1,
          duration: 300,
        }
      ).start(res));
      await new Promise(res => this.setState({ animValue: new Animated.Value(0), showPulse: false }, res));
    }
  }
  /**
 * @returns {JSX} XML
 */
  render() {
    if (!this.props.notificationCount) return this.props.children;
    return (
      <RelativeView>
        {this.state.showPulse && (
          <Animated.View
            style={[
              notificationStyle(this.props),
              {
                borderRadius: getRadiusValue(this.props.radius, this.state.animValue),
                height: getDiameterValue(this.props.radius, this.state.animValue),
                width: getDiameterValue(this.props.radius, this.state.animValue),
                opacity: Animated.add(1, Animated.multiply(-1, this.state.animValue)),
                top: getPositionValue(this.props.top, this.props.radius, this.state.animValue),
                right: getPositionValue(this.props.right, this.props.radius, this.state.animValue),
              },
            ]}
          />
        )}
        <View style={notificationStyle(this.props)}>
          <NotificationText {...this.props}>
            {this.props.notificationCount}
          </NotificationText>
        </View>
        {this.props.children}
      </RelativeView>
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
  top: PropTypes.number,
};
