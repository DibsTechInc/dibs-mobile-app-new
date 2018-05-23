import React from 'react';
import PropTypes from 'prop-types';
import SlidingUpPanel from 'rn-sliding-up-panel';
import styled from 'styled-components';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Config from '../../../../config.json';
import { WHITE, HEIGHT } from '../../../constants';
import UpcomingEvents from '../UpcomingEvents';
import { FlexRow } from '../../styled';

const FULL_HEIGHT = HEIGHT - 30;
const SHORTENED_HEIGHT = HEIGHT / 2.5;

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

const CloseButtonContainer = FlexRow.extend`
  align-items: center;
  height: 40;
  justify-content: flex-end;
  padding-horizontal: 17;
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
    };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.handleDragDown = this.handleDragDown.bind(this);
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
    await new Promise(res => this.setState({ expanding: true }, res));
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
    await new Promise(res => this.setState({ expanding: false }, res));
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
        allowDragging={!this.state.expanded}
      >
        <Panel>
          <CloseButtonContainer>
            {this.state.expanded ? (
              <TouchableOpacity onPress={this.handleDragDown} activeOpacity={1}>
                <Icon name="ios-close" color={Config.STUDIO_COLOR} size={40} />
              </TouchableOpacity>
            ) : null}
          </CloseButtonContainer>
          <UpcomingEvents
            forReceiptPage={false}
            events={this.props.detailedEvents}
            expanded={this.state.expanded}
          />
        </Panel>
      </SlidingUpPanel>
    );
  }
}

UpcomingClassSlider.defaultProps = {
  isUpcomingClassesPage: false,
};

UpcomingClassSlider.propTypes = {
  detailedEvents: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

export default UpcomingClassSlider;
