import { createAction, createActions } from 'redux-actions';
import Config from '../../../config.json';

export const setStudio = createAction('SET_STUDIO', payload => payload);

export const { setStudioLoadingTrue, setStudioLoadingFalse } = createActions({
  SET_STUDIO_LOADING_TRUE: () => true,
  SET_STUDIO_LOADING_FALSE: () => false,
});

/**
 * @param {function} callback on complete
 * @returns {function} dispatches actions for async request
 */
export function requestStudioData(callback) {
  return async function innerRequestStudioData(dispatch, getState, dibsFetch) {
    try {
      const path = `/api/studio?new_id_format=true&studioid=${Config.DIBS_STUDIO_ID}`;
      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) {
        dispatch(setStudio(res.studio));
        return callback();
      }
      return callback(res);
    } catch (err) {
      console.log(err);
      return callback(err);
    }
  };
}

