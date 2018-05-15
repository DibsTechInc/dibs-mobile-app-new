import React from 'react';
import PropTypes from 'prop-types';
import { Svg, Path } from 'react-native-svg';
import SlidingUpPanel from 'rn-sliding-up-panel';
import styled from 'styled-components';

import { WHITE, HEIGHT, LIGHT_GREY } from '../../../constants';
import UnexpandedContent from './UnexpandedContent';

const FULL_HEIGHT = HEIGHT - 30;
const SHORTENED_HEIGHT = HEIGHT / 3;

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
      expanding: false,
      draggable: true,
    };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.getArrowPathStr = this.getArrowPathStr.bind(this);
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
   * @returns {string} path for arrow icon
   */
  getArrowPathStr() {
    if (this.state.expanding) return '';
    if (this.state.expanded) return 'M 5 2 L 20 10 L 35 2';
    return 'M 2 2 L 38 2';
  }
  /**
   * @returns {undefined}
   */
  async handleDragUp() {
    await new Promise(res => this.setState({ expanding: !this.state.expanded }, res));
    await new Promise(res => this.slider.transitionTo({
      toValue: FULL_HEIGHT,
      duration: 100,
      onAnimationEnd: res,
    }));
    this.setState({ expanded: true, expanding: false });
  }
  /**
   * @returns {undefined}
   */
  async handleDragDown() {
    await new Promise(res => this.setState({ expanding: this.state.expanded }, res));
    await new Promise(res => this.slider.transitionTo({
      toValue: SHORTENED_HEIGHT,
      duration: 100,
      onAnimationEnd: res,
    }));
    this.setState({ expanded: false, expanding: false });
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
        allowDragging={this.state.draggable}
      >
        <Panel>
          <Svg style={{ marginTop: 5 }} width={40} height={12}>
            <Path
              stroke={LIGHT_GREY}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              d={this.getArrowPathStr()}
            />
          </Svg>
          {this.state.expanded || this.state.expanding ? null : (
            <UnexpandedContent
              isUpcomingClassesPage={this.props.isUpcomingClassesPage}
              events={this.props.events}
            />
          )}
        </Panel>
      </SlidingUpPanel>
    );
  }
}

UpcomingClassSlider.defaultProps = {
  isUpcomingClassesPage: false,
};

UpcomingClassSlider.propTypes = {
  events: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  isUpcomingClassesPage: PropTypes.bool,
};

export default UpcomingClassSlider;
