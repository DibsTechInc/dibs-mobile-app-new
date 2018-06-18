import { createActions } from 'redux-actions';

export const {
  setFilter,
  setAllFilters,
  clearAllFilters,
  toggleClassName,
  clearFilter,
  setSelectableClassNames,
  setSelectableInstructors,
} = createActions({
  SET_FILTER: payload => payload,
  SET_ALL_FILTERS: payload => payload,
  CLEAR_ALL_FILTERS: () => {},
  TOGGLE_CLASS_NAME: payload => payload,
  CLEAR_FILTER: payload => payload,
  SET_SELECTABLE_CLASS_NAMES: payload => payload,
  SET_SELECTABLE_CLASS_INSTRUCTORS: payload => payload,
});

