import { AsyncStorage } from 'react-native';

/**
 * authFetch
 * @param {string} the query string
 * @param {object} options obj
 * @returns {function} dispatches actions for async request
 */
async function authFetch(url, opts) {
  const token = await AsyncStorage.getItem('STORAGE_KEY');
  
  const options = {
    ...opts,
    headers: {
      'Authorization': 'Bearer ' + token,
    }
  };

  return fetch(url, options);
}

export default authFetch;
