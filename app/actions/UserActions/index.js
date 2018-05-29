import { AsyncStorage, Alert } from 'react-native';
import { createAction } from 'redux-actions';
import {
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  PASSWORD_RESET_ROUTE,
} from '../../constants/RouteConstants';
import Config from '../../../config.json';
import {
  requestCreditCardInfo,
  removeCreditCard,
  requestUserEvents,
  setUpcomingEvents,
  clearCart,
  refreshCart,
} from '../index';

export const setUser = createAction('SET_USER', payload => payload);

/**
 * @param {Object} user json to set in state
 * @returns {function} thunk
 */
export function refreshUser(user) {
  return function innerRefreshUser(dispatch) {
    dispatch(setUser(user));
    dispatch(refreshCart());
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
      dispatch(setUpcomingEvents([]));
      dispatch(clearCart());
      callback();
    } catch (err) {
      console.log(err);
    }
  };
}


/**
 * @returns {function} thunk
 */
export function recordStudioVisit() {
  return async function innerRecordStudioVisit(dispatch, getState, dibsFetch) {
    try {
      await dibsFetch(`/api/user/visit/${Config.DIBS_STUDIO_ID}`, {
        method: 'POST',
        requiresAuth: true,
      });
    } catch (err) {
      console.log(err);
    }
  };
}

/**
 * @returns {function} thunk
 */
export function requestUserData() {
  return async function innerRequestUserData(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success) {
        dispatch(refreshUser(res.user));
        dispatch(recordStudioVisit());
        dispatch(requestCreditCardInfo());
        dispatch(requestUserEvents());
      } else {
        AsyncStorage.clear();
        dispatch(logOutUser());
      }
    } catch (err) {
      Alert.alert('Uh oh!', 'Something went wrong loading the app.');
    }
  };
}

/**
 * @param {string} email validates email
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function validateEmail(email, callback) {
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
      Alert.alert('Uh oh!', res.message);
      return callback(null);
    } catch (err) {
      console.log(err);
      Alert.alert('Uh oh!', 'Something went wrong validating your email.');
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
  return async function innerSignUpUser(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/register', {
        method: 'POST',
        body: payload,
      });
      if (res.success) {
        dispatch(setUser(res.user));
        dispatch(recordStudioVisit());
        dispatch(requestUserEvents());
        return callback();
      }
      if (res.accountDisabled) {
        throw new Error('Account disabled');
      }
      return callback(res);
    } catch (err) {
      console.log(err);
      return callback(err);
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
        dispatch(requestUserEvents());
        callback(res);
      } else {
        callback(res);
      }
    } catch (err) {
      console.log(err);
    }
  };
}

/**
 * updateUser
 * @param {Object} payload from the request
 * @param {function} callback callback function
 * @returns {function} redux thunk
 */
export function updateUser(payload, callback) {
  return async function innerUpdateUser(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        method: 'PUT',
        body: payload,
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
      }
      callback(res);
    } catch (err) {
      console.log(err);
      callback({ message: 'Something went wrong updating your account.' });
    }
  };
}

/**
 * @param {Object} payload from the request
 * @param {function} callback callback function
 * @returns {function} redux thunk
 */
export function updateUserPassword(payload, callback) {
  return async function innerUpdateUserPassword(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/update-password', {
        method: 'PUT',
        body: payload,
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
      }

      callback(res);
    } catch (err) {
      console.log(err);
      callback(null);
    }
  };
}

/**
 * @param {string} list add or remove
 * @param {string} email email of user
 * @param {function} callback callback
 * @returns {function} redux thunk
 */
export function updateUserEmailPreferences(list, email, callback) {
  return async function innerUpdateUserEmailPreferences(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch(`/api/user/email/suppression-list/${list}`, {
        method: 'PUT',
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
      }

      callback(res);
    } catch (err) {
      console.log(err);
      callback(err);
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

/**
 * @param {function} callback callback
 * @returns {function} redux thunk
 */
export function disableUserAccount(callback) {
  return async function innerDisableUserAccount(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        requiresAuth: true,
        method: 'DELETE',
      });

      if (res.success) {
        dispatch(logOutUser());
      }

      callback(res);
    } catch (err) {
      console.log(err);
      callback(err);
    }
  };
}

/**
 * @param {string} email user email
 * @param {password} password user's password
 * @param {function} callback callback
 * @returns {function} redux thunk
 */
export function reactivateUserAccount(email, password, callback) {
  return async function innerReactivateUserAccount(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/reactivate', {
        method: 'PUT',
        body: {
          email,
          password,
        },
      });

      callback(res);
    } catch (err) {
      console.log(err);
      callback(err);
    }
  };
}
