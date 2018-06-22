import React from 'react';
import PropTypes from 'prop-types';
import SlidingUpPanel from 'rn-sliding-up-panel';
import styled from 'styled-components';
import { View, Animated } from 'react-native';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withNavigation } from 'react-navigation';
import { Svg, Path } from 'react-native-svg';
import { isIphoneX } from 'react-native-iphone-x-helper';

import { WHITE, HEIGHT, MAIN_ROUTE, LIGHT_GREY, UPCOMING_CLASS_ROUTE } from '../../../constants';
import {
  setUpcomingEventSliderExpandedTrue,
  setUpcomingEventSliderExpandedFalse,
} from '../../../actions';
import PaginatedSlider from '../PaginatedSlider';
import Header from '../../Header';
import NoEvents from './NoEvents';

const FULL_HEIGHT = HEIGHT - (isIphoneX() ? 100 : 80);

const Panel = styled.View`
  align-items: center;
  background: ${WHITE};
  border-top-left-radius: ${props => (props.roundEdge ? 0 : 25)};
  border-top-right-radius: ${props => (props.roundEdge ? 0 : 25)};
  bottom: 0;
  height: ${HEIGHT};
  padding-top: ${props => (props.roundEdge ? 1 : 25)};
  position: absolute;
  width: 100%;
`;

const SvgContainer = styled.View`
  align-items: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 15;
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
      dragTop: props.shortenedHeight,
      dragBottom: props.shortenedHeight,
      expanded: false,
      expanding: false,
      headerTop: new Animated.Value(-100),
    };
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }
  /**
   * @param {Object} props component is about to get
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.expanded && !this.props.expanded) this.handleDragUp();
    if (!props.expanded && this.props.expanded) this.handleDragDown();
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    this.props.setUpcomingEventSliderExpandedFalse();
  }
  /**
   * @returns {undefined}
   */
  onDragStart() {
    this.setState({
      dragTop: FULL_HEIGHT,
      dragBottom: this.props.shortenedHeight,
    });
  }
  /**
   * @param {number} pos current drag position (height)
   * @returns {undefined}
   */
  onDragEnd(pos) {
    if (!this.props.expanded && pos > (this.props.shortenedHeight + 30)) this.handleDragUp();
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
        toValue: this.props.shortenedHeight,
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
            <Header title="My Classes" isSliderHeader />
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
          allowDragging={Boolean(!this.props.expanded && this.props.events.length)}
        >
          <Panel roundEdge={this.props.expanded}>
            {!this.props.expanded && this.props.events.length && (
              <SvgContainer>
                <Svg width={60} height={4}>
                  <Path d="M 3 2 L 57 2" stroke={LIGHT_GREY} strokeWidth={4} strokeLinecap="round" />
                </Svg>
              </SvgContainer>
            )}
            {!this.props.events.length && (
              <NoEvents />
            )}
            <PaginatedSlider
              forReceiptPage={false}
              events={this.props.events}
              expanded={this.props.expanded}
            />
          </Panel>
        </SlidingUpPanel>
      </View>
    );
  }
}

UpcomingClassSlider.propTypes = {
  navigation: PropTypes.shape().isRequired,
  events: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  expanded: PropTypes.bool.isRequired,
  setUpcomingEventSliderExpandedTrue: PropTypes.func.isRequired,
  setUpcomingEventSliderExpandedFalse: PropTypes.func.isRequired,
  shortenedHeight: PropTypes.number.isRequired,
};

const mapStateToProps = (state, props) => ({
  expanded: state.animation.upcomingEventSliderExpanded,
  shortenedHeight: (
    props.navigation.state.key === UPCOMING_CLASS_ROUTE && HEIGHT < 600 ?
      HEIGHT / 3 : HEIGHT / 2.25
  ),
});
const mapDispatchToProps = {
  setUpcomingEventSliderExpandedTrue,
  setUpcomingEventSliderExpandedFalse,
};

export default compose(
  withNavigation,
  connect(mapStateToProps, mapDispatchToProps)
)(UpcomingClassSlider);
