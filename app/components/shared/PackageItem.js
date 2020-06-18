import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { TEXT_GREY, LIGHT_GREY, WHITE } from '../../constants';
import { addPackageToCart, removePackageFromCart } from '../../actions';

import { NormalText, HeavyText } from '../styled';
import Overlay from './PurchaseItem/Overlay';
import Button from './PurchaseItem/Button';

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: ${WHITE},
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  overflow: hidden;
  padding-top: 20;
  padding-bottom: ${props => (props.showOverlay ? 40 : 20)};
  position: relative;
`;

const MarginedView = styled.View`
  margin-horizontal: 25;
`;

const DescriptionView = styled(MarginedView)`
  width: 50%;
`;

const PackageName = styled(HeavyText)`
  font-size: 18;
`;

const GreyText = styled(NormalText)`
  color: ${TEXT_GREY};
`;

/**
 * @class Package
 * @extends {React.PureComponent}
 */
class Package extends React.PureComponent {
  /**
   * @constructor
   * @constructs Package
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { showOverlay: false };
    this.addToCart = this.addToCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
    this.showOverlayAndStartTimer = this.showOverlayAndStartTimer.bind(this);
  }

  /**
   * @param {Object} props for component
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (this.props.quantity !== props.quantity && props.quantity) {
      this.showOverlayAndStartTimer();
    }
    if (!props.quantity) {
      this.setState({ showOverlay: false });
    }
  }

  /**
  * @param {Object} prevProps component previous prop
  * @param {Object} prevState component previous prop
  * @returns {undefined}
  */
  componentDidUpdate(prevProps, prevState) {
    if (prevState.quantity !== this.state.quantity) {
      this.showOverlayAndStartTimer();
    }
  }

  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
  }

  /**
   * @returns {undefined}
   */
  addToCart() {
    this.props.addPackageToCart({ packageid: this.props.id, autopay: false }); // TODO autopay
  }

  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removePackageFromCart(this.props.id);
  }

  /**
   * @returns {undefined}
   */
  showOverlayAndStartTimer() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
    this.setState({ showOverlay: true });
    this.overlayTimeout = setTimeout(() => {
      this.setState({ showOverlay: false });
      this.overlayTimeout = null;
    }, 5000);
  }

  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container showOverlay={this.state.showOverlay}>
        {!!this.state.showOverlay && (
          <Overlay
            {...this.props}
            removeItem={this.removeFromCart}
            addToCart={this.addToCart}
            fromPackage
          />
        )}
        <DescriptionView>
          <PackageName>
            {this.props.formattedRoundedPrice}
          </PackageName>
          <HeavyText>
            {this.props.name}
          </HeavyText>
          {!!this.props.additionalPackageDescription &&
            <NormalText>
              {this.props.additionalPackageDescription}
            </NormalText>}
          {!this.props.unlimited && !this.props.onlyFirstPurchase ?
            <NormalText>
              {this.props.formattedPricePerClass} / class
            </NormalText> : undefined}
          {!!this.props.autopay && this.props.commitment_period ?
            <GreyText>
              {this.props.commitment_period} month commitment
            </GreyText> : undefined}
          <GreyText>
            {this.props.isCartPage ? this.props.cartExpirationText : this.props.expirationText}
          </GreyText>
        </DescriptionView>
        <MarginedView>
          <Button
            {...this.props}
            text="Buy"
            addToCart={this.addToCart}
            showOverlay={this.showOverlayAndStartTimer}
          />
        </MarginedView>
      </Container>
    );
  }
}

Package.defaultProps = {
  isCartPage: false,
  hasPackages: false,
};

Package.propTypes = {
  id: PropTypes.number,
  isCartPage: PropTypes.bool,
  quantity: PropTypes.number,
  formattedRoundedPrice: PropTypes.string,
  name: PropTypes.string,
  additionalPackageDescription: PropTypes.string,
  onlyFirstPurchase: PropTypes.bool,
  unlimited: PropTypes.bool,
  formattedPricePerClass: PropTypes.string,
  commitment_period: PropTypes.number,
  cartExpirationText: PropTypes.string,
  expirationText: PropTypes.string,
  removePackageFromCart: PropTypes.func.isRequired,
  addPackageToCart: PropTypes.func.isRequired,
  autopay: PropTypes.bool.isRequired,
};

// const mapStateToProps = state => ({});
const mapDispatchToProps = {
  addPackageToCart,
  removePackageFromCart,
};

export default connect(null, mapDispatchToProps)(Package);
