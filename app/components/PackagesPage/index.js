import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isIphoneX } from 'react-native-iphone-x-helper';

import Header from '../Header';
import Package from '../shared/PackageItem';

import { FadeInView } from '../shared';
import { WHITE } from '../../constants';
import { getDetailedStudioPackages } from '../../selectors';

const ScrollContainer = styled.ScrollView`
  background: ${WHITE};
  margin-top: 1px;
`;

const IPhoneXPadding = styled.View`
  background: ${WHITE};
  height: ${Number(isIphoneX()) * 25};
  width: 100%;
`;

/**
 * @class PackagesPage
 * @extends {React.PureComponent}
 */
class PackagesPage extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView>
        <Header title="Packages" />
        <ScrollContainer>
          {this.props.packages.map(pkg => (
            <Package
              key={pkg.id}
              {...pkg}
            />
          ))}
        </ScrollContainer>
        <IPhoneXPadding />
      </FadeInView>
    );
  }
}

PackagesPage.propTypes = {
  packages: PropTypes.arrayOf(PropTypes.shape()),
};

const mapStateToProps = state => ({
  packages: getDetailedStudioPackages(state),
});

export default connect(mapStateToProps)(PackagesPage);
