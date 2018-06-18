import { createSelector } from 'reselect';
import { getStudioData } from '../index';
import { getFilterLocationIds } from '../../FiltersSelectors';

/**
 * @param {Object} state in store
 * @returns {Array<Object>} studio locations
 */
export function getStudioLocations(state) {
  return getStudioData(state).locations || [];
}

export const getStudioVisibleLocations = createSelector(
  getStudioLocations,
  locations => locations.filter(l => l.visible)
);

export const getStudioHasMultipleLocations = createSelector(
  getStudioLocations,
  locs => (locs.length > 1)
);

export const getStudioHasMultipleVisibleLocations = createSelector(
  getStudioVisibleLocations,
  locations => (locations.length > 1)
);

export const getStudioCityLocations = createSelector(
  getStudioVisibleLocations,
  locations => locations.reduce(
    (acc, location) => {
      const cityLocation = acc.find(({ name }) => name === location.city);
      if (!cityLocation) {
        acc.push({
          name: location.city,
          ids: String(location.id),
        });
        return acc;
      }
      cityLocation.ids += `,${location.id}`;
      return acc;
    },
    []
  )
);

export const getStudioLocationFilterOptions = createSelector(
  [
    getStudioCityLocations,
    getStudioLocations,
  ],
  (cityLocations, studioLocations) => ([
    ...cityLocations.map(({ name, ids }) => ({ label: `${name} - All`, value: ids })),
    ...studioLocations.map(({ city, name, id }) => ({ label: `${city} - ${name}`, value: String(id) })),
  ])
);

export const getSelectedStudioLocationOption = createSelector(
  [
    getStudioLocationFilterOptions,
    getFilterLocationIds,
  ],
  (options, selectedLocationIds) => options.find(({ value }) => value === selectedLocationIds)
);

export const getSelectedStudioLocationLabel = createSelector(
  getSelectedStudioLocationOption,
  option => (option ? option.label : '')
);
