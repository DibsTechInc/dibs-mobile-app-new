import { handleActions } from 'redux-actions';
import {
  setFilter,
  setAllFilters,
  clearAllFilters,
  toggleClassName,
  clearFilter,
  setSelectableClassNames,
  setSelectableInstructors,
} from '../../actions';

const initialState = {
  classNames: [],
  instructorid: null,
  locationids: '',
  searchQuery: '',
  selectableClassNames: [],
  selectableInstructors: [],
};

/**
 * TOGGLE_CLASS_NAME callback
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleToggleClassName(state, { payload }) {
  const nextState = { ...state };

  if (nextState.classNames.includes(payload)) {
    nextState.classNames = nextState.classNames.filter(name => name !== payload);
  } else {
    nextState.classNames = [...nextState.classNames, payload];
  }

  return nextState;
}

export default handleActions({
  [setFilter]: (state, { payload }) => ({ ...state, ...payload }),
  [clearAllFilters]: () => initialState,
  [toggleClassName]: handleToggleClassName,
  [setAllFilters]: (state, { payload }) => ({ ...initialState, ...payload }),
  [clearFilter]: (state, { payload }) => ({ ...state, [payload]: initialState[payload] }),
  [setSelectableClassNames]: (state, { payload }) => ({ ...state, selectableClassNames: payload }),
  [setSelectableInstructors]: (state, { payload }) => ({ ...state, selectableInstructors: payload }),
}, initialState);
