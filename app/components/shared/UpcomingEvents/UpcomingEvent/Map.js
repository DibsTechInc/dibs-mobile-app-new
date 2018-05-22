import React from 'react';
import PropTypes from 'prop-types';
import MapView, { Marker } from 'react-native-maps';
import { connect } from 'react-redux';

import { getStudioName } from '../../../../selectors';

const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

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
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
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
    );
  }
}

Map.propTypes = {
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  markerTitle: PropTypes.string.isRequired,
  locationName: PropTypes.string.isRequired,
};

const mapStateToProps = (state, props) => ({
  markerTitle: `${getStudioName(state)} - ${props.locationName}`,
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Map);
