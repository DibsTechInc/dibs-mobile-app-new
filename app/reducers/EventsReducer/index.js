import { handleActions } from 'redux-actions';
import { omit } from 'lodash';
import {
  setEvents,
  previewEvents,
  addKeyToFetchingEvents,
  removeKeyFromFetchingEvents,
} from '../../actions/EventActions';

const initialState = {
  fetching: {},
  previewed: false,
  data: [],
};

// TODO marking event as sold out and updating spot count

/**
 * @param {Object} state of events
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleSetEvents(state, { payload }) {
  const events = state.data.concat(payload).reduce((acc, item) => {
    const index = acc.findIndex(event => event.id === item.id);
    if (index >= 0) {
      acc[index] = item;
      return acc;
    }
    acc.push(item);
    return acc;
  }, []).sort((a, b) => {
    const dateDiff = new Date(a.start_time) - new Date(b.start_time);
    if (dateDiff !== 0) return dateDiff;
    return a.id - b.id;
  });
  return { ...state, data: events };
}

export default handleActions({
  [setEvents]: handleSetEvents,
  [previewEvents]: state => ({ ...state, previewed: true }),
  [addKeyToFetchingEvents]: (state, { payload }) => ({
    ...state,
    fetching: { ...state.fetching, [payload]: true },
  }),
  [removeKeyFromFetchingEvents]: (state, { payload }) => ({ ...state, fetching: omit(state.fetching, payload) }),
}, initialState);
