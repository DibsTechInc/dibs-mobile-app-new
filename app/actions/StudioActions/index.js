import { createActions } from 'redux-actions';
import { Alert, AsyncStorage } from 'react-native';
import Config from '../../../config.json';

export const {
  setStudio,
  setStudioLoadingTrue,
  setStudioLoadingFalse,
} = createActions({
  SET_STUDIO: payload => payload,
  SET_STUDIO_LOADING_TRUE: () => true,
  SET_STUDIO_LOADING_FALSE: () => false,
});

/**
 * @param {boolean} [showAlert=true] if false will not show native alert on fail
 * @returns {function} thunk
 */
export function requestStudioData(showAlert = true) {
  return async function innerRequestStudioData(dispatch, getState, dibsFetch) {
    if (getState().studio.loading) return;
    try {
      const path = `/api/studio?new_id_format=1&studioid=${Config.DIBS_STUDIO_ID}`;
      dispatch(setStudioLoadingTrue());
      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) {
        dispatch(setStudio(res.studio));
        await AsyncStorage.setItem(Config.STUDIO_DATA_KEY, JSON.stringify(res.studio));
        dispatch(setStudioLoadingFalse());
        return;
      }
      if (showAlert) Alert.alert('Error requesting studio data', res.message);
      else throw new Error('Failed to get the studio data');
      return;
    } catch (err) {
      console.log(err);
      if (showAlert) Alert.alert('Something went wrong loading your app.');
      else throw err;
    }
  };
}

