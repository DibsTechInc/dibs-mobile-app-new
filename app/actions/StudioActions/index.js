import { createActions } from 'redux-actions';
import { Alert } from 'react-native';
import Config from '../../../config.json';

export const { setStudio, setStudioLoadingTrue, setStudioLoadingFalse } = createActions({
  SET_STUDIO: payload => payload,
  SET_STUDIO_LOADING_TRUE: () => true,
  SET_STUDIO_LOADING_FALSE: () => false,
});

/**
 * @param {function} callback on complete
 * @returns {function} dispatches actions for async request
 */
export function requestStudioData(callback) {
  return async function innerRequestStudioData(dispatch, getState, dibsFetch) {
    if (getState().studio.loading) return null;
    try {
      const path = `/api/studio?new_id_format=1&studioid=${Config.DIBS_STUDIO_ID}`;
      dispatch(setStudioLoadingTrue());
      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) {
        dispatch(setStudio(res.studio));
        dispatch(setStudioLoadingFalse());
        return callback();
      }
      Alert.alert(
        'Uh oh!',
        res.message
      );
      return callback(res);
    } catch (err) {
      console.log(err);
      Alert.alert(
        'Uh oh!',
        'Something went wrong loading your app.'
      );
      return callback(err);
    }
  };
}

