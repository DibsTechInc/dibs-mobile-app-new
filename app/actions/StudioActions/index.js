import {
  SET_STUDIO,
  SET_STUDIO_LOADING_FALSE,
  SET_STUDIO_LOADING_TRUE,
} from '../../constants/StudioConstants';

/**
 * setStudio
 * @param {Object} value the studio
 * @returns {Object} action on the state
 */
export function setStudio(value) { // eslint-disable-line import/prefer-default-export
  return { type: SET_STUDIO, value };
}

/**
 * setEventsLoadingTrue
 * @returns {Object} action on the state
 */
export function setStudioLoadingTrue() {
  return { type: SET_STUDIO_LOADING_TRUE };
}

/**
 * setStudioLoadingFalse
 * @returns {Object} action on the state
 */
export function setStudioLoadingFalse() {
  return { type: SET_STUDIO_LOADING_FALSE };
}

/**
 * requestStudioData from the server
 * @returns {function} dispatches actions for async request
 */
export function requestStudioData(cb) {
  return function innerRequestStudioData(dispatch, getState) {
    const query = 'http://ondibs.com/api/studio/?studioid=20456&source=mb';

    fetch(query)
      .then(res => res.json())
      .then((res) => {
        dispatch(setStudio(res.studio));
        cb();
      })
      .catch(error => {
        // set error here
        console.log(error);
      });
  }
}

