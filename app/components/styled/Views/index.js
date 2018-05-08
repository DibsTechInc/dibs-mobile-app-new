import styled from 'styled-components';
import { Dimensions } from 'react-native';
import { WHITE } from '../../../constants';
import Config from '../../../../config.json';

export const FlexCenter = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const FlexRow = styled.View`
  flex-direction: row;
`;

export const RightAlignedColumn = styled.View`
  align-items: flex-end;
`;

export const SpaceBetweenRow = FlexRow.extend`
  justify-content: space-between;
`;

export const StudioColorBottomBorder = styled.View`
  border-bottom-width: 1;
  border-color: ${Config.STUDIO_COLOR}
`;

export const MaterialPanelView = styled.View`
  background-color: ${WHITE};
  border-radius: ${props => (props.borderRadius || '3px')};
  border-color: #ddd;
  border-left-width: 0;
  border-top-width: 0;
  border-width: 0.3;
  elevation: 3;
  height: ${props => (props.height ? props.height : 'auto')};
  margin: 10px;
  padding-horizontal: 10px;
  padding-top: 15px;
  padding-bottom: 20px;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 4;
  width: ${props => (props.width || (Dimensions.get('window').width - 20))};
`;

export const Overlay = styled.View`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

