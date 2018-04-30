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
export function requestStudioData() {
  return async function innerRequestStudioData(dispatch, getState, dibsFetch) {
    if (getState().studio.loading) return;
    try {
      const path = `/api/studio?new_id_format=true&studioid=${Config.DIBS_STUDIO_ID}`;
      dispatch(setStudioLoadingTrue());
      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) {
        dispatch(setStudio(res.studio));
      }
    } catch (err) {
      console.log(err);
    }
    dispatch(setStudioLoadingFalse());
  };
}

