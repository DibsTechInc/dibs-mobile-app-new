import { AsyncStorage } from 'react-native';
import { createAction } from 'redux-actions';
import { LOGIN_ROUTE, REGISTER_ROUTE, MAIN_ROUTE } from '../../constants/RouteConstants';
import Config from '../../../config.json';

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
      callback();
    } catch (err) {
      console.log(err);
    }
  };
}
