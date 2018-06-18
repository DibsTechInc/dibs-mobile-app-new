import { createSelector } from 'reselect';

/**
 * getFiltersState
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFiltersState(state) {
  return state.filters;
}

/**
 * getStringifiedFilters
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getStringifiedFilters(state) {
  return JSON.stringify(getFiltersState(state));
}

/**
 * getFilterLocationIds
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFilterLocationIds(state) {
  return getFiltersState(state).locationids;
}

export const getFilterLocationIdsAsArray = createSelector(
  getFilterLocationIds,
  locationids => (locationids ? locationids.split(',').map(id => +id) : [])
);

/**
 * getFiltersClassid
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFiltersClassid(state) {
  return getFiltersState(state).classid;
}

/**
 * getFiltersClassNames
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFiltersClassNames(state) {
  return getFiltersState(state).classNames;
}

/**
 * getFiltersSelectedLocationId
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFiltersSelectedLocationId(state) {
  return getFiltersState(state).selectedLocationId;
}

/**
 * getFiltersInstructorId
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFiltersInstructorId(state) {
  return getFiltersState(state).instructorid;
}

export const getNoFiltersAreApplied = createSelector(
  [
    getFiltersClassNames,
    getFiltersInstructorId,
    getFilterLocationIds,
  ],
  (classNames, instructorid, locationids) => (!classNames.length && !instructorid && !locationids)
);

/**
 * getSelectableClassNames
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getSelectableClassNames(state) {
  return getFiltersState(state).selectableClassNames;
}

export const getSelectableClassNameOptions = createSelector(
  getSelectableClassNames,
  classNames => classNames.map(name => ({ label: name, value: name }))
);

/**
 * getSelectableInstructors
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getSelectableInstructors(state) {
  return getFiltersState(state).selectableInstructors;
}

export const getSelectableInstructorOptions = createSelector(
  getSelectableInstructors,
  instructors => instructors.map(({ name, id }) => ({ label: name, value: id }))
);

export const getSelectedInstructorOption = createSelector(
  [
    getSelectableInstructorOptions,
    getFiltersInstructorId,
  ],
  (options, instructorId) => (options.find(option => option.value === instructorId) || {})
);

export const getSelectedInstructorName = createSelector(
  getSelectedInstructorOption,
  option => (option.label || '')
);

/**
 * getFiltersSearchQuery
 * @param {Object} state in Redux store
 * @returns {Object} event filters for schedule
 */
export function getFiltersSearchQuery(state) {
  return getFiltersState(state).searchQuery;
}
