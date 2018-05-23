import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { getStudioName } from '../../../../selectors';

const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

const InvisibleInteractionBlocker = styled.View`
  height: 250;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
`;

/**
 * @class MapView
 * @extends {React.PureComponent}
 */
class Map extends React.PureComponent {
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.map.animateToRegion({
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }, 1);
  }
  /**
   * @param {Object} props component is about to get
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.expanded !== this.props.expanded) {
      this.map.animateToCoordinate({
        latitude: this.props.latitude,
        longitude: this.props.longitude,
      }, 1);
    }
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View style={{ height: 250, position: 'relative' }}>
        <MapView
          ref={(ref) => { this.map = ref; }}
          style={{ height: 250, marginBottom: 10 }}
          initialRegion={{
            latitude: this.props.latitude,
            longitude: this.props.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
        >
          <Marker
            coordinate={{ latitude: this.props.latitude, longitude: this.props.longitude }}
            title={this.props.markerTitle}
            description=""
          />
        </MapView>
        {this.props.allowInteraction ? null : (
          <InvisibleInteractionBlocker
            onStartShouldSetResponder={() => true}
          />
        )}
      </View>
    );
  }
}

Map.propTypes = {
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  markerTitle: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
  allowInteraction: PropTypes.bool.isRequired,
  expanded: PropTypes.bool.isRequired,
};

const mapStateToProps = (state, props) => ({
  markerTitle: `${getStudioName(state)} - ${props.locationName}`,
  expanded: state.animation.upcomingEventSliderExpanded,
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Map);
