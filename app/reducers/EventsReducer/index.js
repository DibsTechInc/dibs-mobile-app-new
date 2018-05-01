import { handleActions, combineActions } from 'redux-actions';
import { setEvents, setEventsLoadingTrue, setEventsLoadingFalse } from '../../actions/EventActions';

const initialState = {
  loading: false,
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
  [combineActions(setEventsLoadingTrue, setEventsLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
  [setEvents]: handleSetEvents,
}, initialState);
