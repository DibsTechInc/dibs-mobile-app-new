import React from 'react';
import PropTypes from 'prop-types';
import SlidingUpPanel from 'rn-sliding-up-panel';
import styled from 'styled-components';
import { View, Animated } from 'react-native';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withNavigation } from 'react-navigation';

import { WHITE, HEIGHT, MAIN_ROUTE } from '../../../constants';
import {
  setUpcomingEventSliderExpandedTrue,
  setUpcomingEventSliderExpandedFalse,
} from '../../../actions';
import UpcomingEvents from '../UpcomingEvents';
import Header from '../../Header';

const FULL_HEIGHT = HEIGHT - 100;
const SHORTENED_HEIGHT = HEIGHT / 2.5;

const Panel = styled.View`
  align-items: center;
  background: ${WHITE};
  border-top-left-radius: ${props => (props.roundEdge ? 0 : 25)};
  border-top-right-radius: ${props => (props.roundEdge ? 0 : 25)};
  bottom: 0;
  height: ${HEIGHT};
  padding-top: 20;
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
      headerTop: new Animated.Value(-100),
    };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }
  /**
   * @param {Object} props component is about to get
   * @returns {undefined|null} handles when the slider is closed by the header
   */
  componentWillReceiveProps(props) {
    if (props.expanded && !this.props.expanded) return this.handleDragUp();
    if (!props.expanded && this.props.expanded) return this.handleDragDown();
    return null;
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
    if (!this.props.expanded && pos > (SHORTENED_HEIGHT + 30)) this.handleDragUp();
    else if (!this.props.expanded || pos < (FULL_HEIGHT - 30)) this.handleDragDown();
    else this.handleDragUp();
  }
  /**
   * @returns {undefined}
   */
  async handleDragUp() {
    await new Promise(res => this.setState({ expanding: true }, res));
    await Promise.all([
      new Promise(res => this.slider.transitionTo({
        toValue: FULL_HEIGHT,
        duration: 100,
        onAnimationEnd: res,
      })),
      new Promise(res => Animated.timing(
        this.state.headerTop,
        {
          toValue: 0,
          duration: 100,
        }
      ).start(res)),
    ]);
    this.setState({ expanding: false });
    this.props.setUpcomingEventSliderExpandedTrue();
  }
  /**
   * @returns {undefined}
   */
  async handleDragDown() {
    await new Promise(res => this.setState({ expanding: true }, res));
    await Promise.all([
      new Promise(res => this.slider.transitionTo({
        toValue: SHORTENED_HEIGHT,
        duration: 100,
        onAnimationEnd: res,
      })),
      new Promise(res => Animated.timing(
        this.state.headerTop,
        {
          toValue: -100,
          duration: 100,
        }
      ).start(res)),
    ]);
    this.setState({ expanding: false });
    this.props.setUpcomingEventSliderExpandedFalse();
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
        onStartShouldSetResponder={() => false}
        pointerEvents="box-none"
      >
        {this.props.navigation.state.key === MAIN_ROUTE && (
          <Animated.View style={{ top: this.state.headerTop, left: 0, right: 0, position: 'absolute' }}>
            <Header title="My Classes" />
          </Animated.View>
        )}
        <SlidingUpPanel
          visible
          showBackdrop={false}
          draggableRange={{ top: this.state.dragTop, bottom: this.state.dragBottom }}
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}
          ref={node => this.slider = node}
          allowMomentum={false}
          allowDragging={!this.props.expanded}
        >
          <Panel roundEdge={this.props.expanded || this.state.expanding}>
            <UpcomingEvents
              forReceiptPage={false}
              events={this.props.detailedEvents}
              expanded={this.props.expanded}
            />
          </Panel>
        </SlidingUpPanel>
      </View>
    );
  }
}

UpcomingClassSlider.defaultProps = {
  isUpcomingClassesPage: false,
};

UpcomingClassSlider.propTypes = {
  navigation: PropTypes.shape().isRequired,
  detailedEvents: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  expanded: PropTypes.bool.isRequired,
  setUpcomingEventSliderExpandedTrue: PropTypes.func.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  expanded: state.animation.upcomingEventSliderExpanded,
});
const mapDispatchToProps = {
  setUpcomingEventSliderExpandedTrue,
  setUpcomingEventSliderExpandedFalse,
};

export default compose(
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps)
)(UpcomingClassSlider);
