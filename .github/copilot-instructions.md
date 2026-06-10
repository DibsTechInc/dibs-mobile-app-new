# Copilot instructions for dibs-mobile-app

## Big picture architecture
- Expo SDK 36 React Native app with React Navigation v4 and Redux + redux-thunk.
- Entry point is App.js: loads fonts/images, initializes Sentry, hydrates studio + user data, and starts event polling.
- Navigation root is app/router/index.js (stack navigator; initial route depends on auth token).
- State is split by domain in app/actions/, app/reducers/, and app/selectors/; actions are thunk-based.
- Network access is centralized in app/util/dibs-fetch.js; all thunks receive dibsFetch as the third arg.

## Data flow patterns
- App.js reads AsyncStorage using Config.USER_TOKEN_KEY and Config.STUDIO_DATA_KEY, then dispatches requestStudioData/requestUserData.
- API requests call dibsFetch(path, { method, body, requiresAuth }) which injects auth headers and refreshes tokens.
- Error reporting is routed through Sentry (sentry-expo) and error UI is ErrorPage + Modal.

## Configuration / whitelabeling
- Runtime configuration is provided by root-level config.json (gitignored) and app.json (Expo config).
- Config keys used at runtime include DIBS_HOST, DIBS_STUDIO_ID, USER_TOKEN_KEY, STUDIO_COLOR, SENTRY_DSN, STUDIO_DATA_KEY.
- Studio-specific assets live under assets/ (icon, splash, main-page) and are preloaded in App.js.

## Key workflows (from README.install.md / README.legacy.md)
- Install deps: npm i
- Run app: npm run start (or expo start)
- Build/publish: node ./bin/publish.js -s <studioId> [-d|--downloadAssets] [-c|--downloadConfigs] [-p|--prod]
- Download studio assets/configs: node ./bin/download-assets.js --studio <studioId>

## Project-specific conventions
- Thunks typically return async functions with signature (dispatch, getState, dibsFetch) and use createAction from redux-actions.
- Route constants live in app/constants/RouteConstants and are used by navigation + actions.
- UI is organized by feature under app/components/ (e.g., AuthPage, ProfilePage, SchedulePage).
- Studio “flex” behavior is a special case when Config.DIBS_STUDIO_ID === 1 (see App.js).
