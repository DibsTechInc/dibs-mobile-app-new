import React from 'react';
import PropTypes from 'prop-types';
import { Svg } from 'react-native';
import SlidingUpPanel from 'rn-sliding-up-panel';
import styled from 'styled-components';
import { promisify } from 'bluebird';

import { WHITE, HEIGHT } from '../../../constants';

const FULL_HEIGHT = HEIGHT - 30;
const SHORTENED_HEIGHT = (HEIGHT / 2) - 20;

const Panel = styled.View`
  align-items: center;
  background: ${WHITE};
  border-top-left-radius: 25;
  border-top-right-radius: 25;
  bottom: 0;
  height: ${HEIGHT};
  position: absolute;
  width: 100%;
`;

/**
 * @class UpcomingClassSlider
 * @extends {React.PureComponent}
 */
class UpcomingClassSlider extends React.PureComponent {
  /**
   * @constructor
   * @constructs UpcomingClassSlider
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = {
      dragTop: SHORTENED_HEIGHT,
      dragBottom: SHORTENED_HEIGHT,
      expanded: false,
    };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }
  /**
   * @returns {undefined}
   */
  onDragStart() {
    this.setState({
      dragTop: FULL_HEIGHT,
      dragBottom: SHORTENED_HEIGHT,
    });
  }
  /**
   * @param {number} pos current drag position (height)
   * @returns {undefined}
   */
  onDragEnd(pos) {
    if (!this.state.expanded && pos > (SHORTENED_HEIGHT + 30)) this.handleDragUp();
    else if (!this.state.expanded || pos < (FULL_HEIGHT - 30)) this.handleDragDown();
    else this.handleDragUp();
  }
  /**
   * @returns {undefined}
   */
  async handleDragUp() {
    await new Promise(res => this.slider.transitionTo({
      toValue: FULL_HEIGHT,
      duration: 100,
      onAnimationEnd: res,
    }));
    this.setState({ expanded: true });
  }
  /**
   * @returns {undefined}
   */
  async handleDragDown() {
    await new Promise(res => this.slider.transitionTo({
      toValue: SHORTENED_HEIGHT,
      duration: 100,
      onAnimationEnd: res,
    }));
    this.setState({ expanded: false });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <SlidingUpPanel
        visible
        showBackdrop={false}
        draggableRange={{ top: this.state.dragTop, bottom: this.state.dragBottom }}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        ref={node => this.slider = node}
        allowMomentum={false}
      >
        <Panel>
        </Panel>
      </SlidingUpPanel>
    );
  }
}

UpcomingClassSlider.propTypes = {};

export default UpcomingClassSlider;
