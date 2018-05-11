import { AsyncStorage } from 'react-native';
import { createAction } from 'redux-actions';
import {
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  MAIN_ROUTE,
  PASSWORD_RESET_ROUTE,
} from '../../constants/RouteConstants';
import Config from '../../../config.json';
import { requestCreditCardInfo, removeCreditCard } from '../index';

export const setUser = createAction('SET_USER', payload => payload);

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function requestUserData(callback) {
  return async function innerRequestUserData(dispatch, getstate, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success) dispatch(setUser(res.user));
      else console.log(res);
    } catch (err) {
      console.log(err);
    }
    callback();
  };
}

/**
 * @param {string} email validates email
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function validateEmail(email, callback = () => {}) {
  return async function innerValidateEmail(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/email/verify', {
        method: 'POST',
        body: {
          email,
          validate: true,
        },
      });
      if (res.success) {
        return callback(LOGIN_ROUTE);
      }
      if (res.message === 'Needs to reset password') {
        return callback(PASSWORD_RESET_ROUTE);
      }
      if (res.message === 'No user with that email') {
        return callback(REGISTER_ROUTE);
      }
      return callback(null);
    } catch (err) {
      console.log(err);
      return callback(null);
    }
  };
}

/**
 * @returns {function} thunk
 */
export function recordStudioVisit() {
  return async function innerRecordStudioVisit(dispatch, getState, dibsFetch) {
    const { user, studio } = getState();
    if (!user || !user.id) return;
    console.log(studio.data.id, 'studioid')
    try {
      await dibsFetch(`/api/user/visit/${studio.data.id}`, {
        method: 'POST',
      });
    } catch (err) {
      console.log(err);
    }
  };
}

/**
 * @param {object} payload user registration data
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function signUpUser(payload, callback) {
  return async function innerSignInUser(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/register', {
        method: 'POST',
        body: payload,
      });
      if (res.success) {
        dispatch(setUser(res.user));
        dispatch(recordStudioVisit());
        return callback(MAIN_ROUTE);
      }
      return callback(null);
    } catch (err) {
      console.log(err);
      return callback(null);
    }
  };
}

/**
 * @param {string} email of user
 * @param {string} password user entered
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function submitLogin(email, password, callback) {
  return async function innerUserLogin(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/login', {
        method: 'POST',
        body: {
          email,
          password,
        },
      });
      if (res.success) {
        dispatch(setUser(res.user));
        dispatch(recordStudioVisit());
        dispatch(requestCreditCardInfo());
        callback(res.user);
      } else {
        callback(null);
      }
    } catch (err) {
      console.log(err);
    }
  };
}

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function logOutUser(callback = () => {}) {
  return async function innerLogOutUser(dispatch) {
    try {
      await AsyncStorage.removeItem(Config.USER_TOKEN_KEY);
      dispatch(setUser({}));
      dispatch(removeCreditCard());
      callback();
    } catch (err) {
      console.log(err);
    }
  };
}

/**
 * @param {String} email of user
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function createPasswordResetLink(email, callback = () => {}) {
  return async function innerCreatePasswordResetLink(dispatch, getState, dibsFetch) {
    try {
      const { success, message } = await dibsFetch('/api/user/password/reset', {
        method: 'POST',
        body: { email, fromWidget: true, studioId: Config.DIBS_STUDIO_ID },
      });
      return callback(null, { success, message });
    } catch (err) {
      console.log(err);
      return callback(null, { success: false, message: 'Something went wrong sending your password reset email.' });
    }
  };
}
