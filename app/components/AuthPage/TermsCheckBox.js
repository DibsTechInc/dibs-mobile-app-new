import React from 'react';
import { View } from 'react-native';
import { withNavigation } from 'react-navigation';
import PropTypes from 'prop-types';

import { CheckBox } from 'react-native-elements';

import { NormalText } from '../styled';
import { DEFAULT_BG, RED, TERMS_AND_CONDITIONS_ROUTE } from '../../constants';
import Config from '../../../config.json';

const LinkedText = NormalText.extend`
  color: ${Config.STUDIO_COLOR};
`;

/**
 * @class TermsCheckBox
 * @extends {React.PureComponent}
 */
class TermsCheckBox extends React.PureComponent {
  /**
   * @constructor
   * @constructs TermsCheckBox
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.handleOnPressNavStudioTerms = this.handleOnPressNav.bind(this, { url: Config.STUDIO_TERMS_LINK });
    this.handleOnPressNavDibsTerms = this.handleOnPressNav.bind(this, { url: Config.DIBS_TERMS_LINK });
  }
  /**
   * @param{object} urlObj the nav object
   * @returns {undefined}
   */
  handleOnPressNav(urlObj) {
    this.props.navigation.navigate(TERMS_AND_CONDITIONS_ROUTE, urlObj);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <View style={{ width: 250, height: 30, position: 'relative', marginTop: 5, flexDirection: 'row' }}>
        <CheckBox
          title=""
          iconType="material-community"
          checkedIcon="checkbox-marked"
          uncheckedIcon="checkbox-blank-outline"
          checkedColor={Config.STUDIO_COLOR}
          checked={this.props.tAndC}
          containerStyle={{ backgroundColor: DEFAULT_BG, position: 'absolute', top: -10, left: -22 }}
          textStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
          onPress={this.props.onPress}
          size={20}
        />
        <View style={{ position: 'absolute', width: '90%', left: 22, top: 5 }}>
          <NormalText style={{ flex: 1, flexWrap: 'wrap' }}>
            I have read & agreed to the <LinkedText onPress={this.handleOnPressNavStudioTerms}>
              {this.props.studioName}
            </LinkedText> and <LinkedText onPress={this.handleOnPressNavDibsTerms}>
            Dibs
          </LinkedText> Terms and Conditions.
          </NormalText>
        </View>
        {this.props.tAndCError.length && <NormalText style={{ color: RED, position: 'absolute', bottom: -55, fontSize: 12 }}>
          {this.props.tAndCError}
        </NormalText>}
      </View>
    );
  }
}

TermsCheckBox.propTypes = {
  onPress: PropTypes.func,
  studioName: PropTypes.string,
  tAndC: PropTypes.bool,
  tAndCError: PropTypes.string,
  navigation: PropTypes.shape(),
};

export default withNavigation(TermsCheckBox);
