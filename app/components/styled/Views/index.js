import styled from 'styled-components';
import { Dimensions } from 'react-native';
import { WHITE } from '../../../constants';

export const FlexCenter = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const SpaceBetweenRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
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

