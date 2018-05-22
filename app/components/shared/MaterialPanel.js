import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity } from 'react-native';
import { DARK_TEXT_GREY } from '../../constants';
import { MaterialPanelView, HeavyText } from '../styled';


const Heading = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 16px;
  margin-bottom: 15px;
`;

/**
 * @class MaterialPanel
 * @extends {React.PureComponent}
 */
class MaterialPanel extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <MaterialPanelView height={this.props.height} style={this.props.style}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {this.props.heading && (
            <Heading style={this.props.headerStyle}>
              {this.props.heading}
            </Heading>
          )}
          {this.props.headingRight && (
            <TouchableOpacity onPress={this.props.onPressHeadingRight}>
              <Heading style={this.props.headerRightStyle}>
                {this.props.headingRight}
              </Heading>
            </TouchableOpacity>
          )}
        </View>
        {this.props.children}
      </MaterialPanelView>
    );
  }
}

MaterialPanel.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.shape(),
  headerStyle: PropTypes.shape(),
  headerRightStyle: PropTypes.shape(),
  heading: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  headingRight: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onPressHeadingRight: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

export default MaterialPanel;
