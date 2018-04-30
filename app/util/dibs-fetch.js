import { AsyncStorage } from 'react-native';
import Config from '../../config.json';

/**
 * @param {function} refreshToken when making authenticated requests
 * @param {string} path to route on Dibs server
 * @param {Object} opts options for fetch call and some custom ones
 * @returns {Object} response from Dibs server
 */
async function dibsFetch(refreshToken, path, {
  type = 'json',
  body,
  requiresAuth = false,
  ...opts
} = {}) {
  const headers = {};
  switch (type) {
    case 'json':
    default:
      headers.Accept = 'application/json';
      headers['Content-Type'] = 'application/json';
  }
  if (requiresAuth) {
    const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
    headers.Authorization = `Bearer ${token}`;
  }
  const options = { headers, ...opts };
  if (body) options.body = JSON.stringify(body);
  let res = await fetch(`${Config.DIBS_HOST}${path}`, options);
  if (type === 'json') res = await res.json();
  if ((requiresAuth || path.includes('login')) && res.success) refreshToken(path, res);
  return res;
}

/**
 * @param {string} path to route on Dibs server
 * @param {Object} res response body of parent request
 * @returns {Promise<undefined>} refreshes the user's JWT
 */
async function refreshUserToken(path, res) {
  try {
    if (/logout|token/.test(path)) return;
    if (/login|register/.test(path) && res.token) {
      await AsyncStorage.setItem(Config.USER_TOKEN_KEY, res.token);
      return;
    }
    const response = await dibsFetch('/api/user/token', {
      method: 'GET',
      requiresAuth: true,
    });
    if (response.success) await AsyncStorage.setItem(Config.USER_TOKEN_KEY, response.token);
  } catch (err) {
    console.error(err);
  }
}

export default dibsFetch.bind(null, refreshUserToken);
