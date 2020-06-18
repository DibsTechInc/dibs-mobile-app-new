A lot of help [here](https://levelup.gitconnected.com/react-native-how-to-publish-an-expo-app-to-testflight-debug-common-errors-90e427b4b5ea)

# Prereq
1. Go to (appleid.apple.com) and set up an Application-specific Password (Security > App-Specific Passwords) and store so you have it
1. Create the app id:
  1. go to (developer.apple.com), Certificates, Identifiers, & Profiles > Idenfitiers > App IDs
  1. click add button
  1. select App IDs
  1. give it a description, and a Bundle ID (Explicit) like `com.ondibs.[appname]app`
  1. click Next, and Register
1. set up sentry
  1. go to (https://sentry.io/settings/dibs-technology-inc/projects/)
  1. create a new project
  1. Set Platform to Mobile > Objective-C
  1. Set project Name to a name you want to use, but make it lowercase and with dashes, this will be your `sentry-project`
  1. Click Create
  1. Click until getting back to project
  1. Copy down the dsn in the following:

```
@import Sentry;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [SentrySDK startWithOptions:@{
        @"dsn": @"[copy this value as sentry-dsn]",
        @"debug": @(YES)
    }];
    return YES;
}
```
  1. go to (https://sentry.io/settings/account/api/auth-tokens/) and save that `auth token` to be used as `sentry-authtoken`

# New Project

## add images
1. Add the icon of the project to `./assets/icon.png`
  - must be square and specifically 1024x1024
1. ADd the splash screen of the project to `./assets/spash.png`
1. Add the main page background to `./assets/img/main-page.png`

## other config
1. Create a random value using (https://www.random.org/strings/?num=1&len=20&digits=on&loweralpha=on&unique=on&format=html&rnd=new). This will be your `user-token-key`

1. create a `config.json` object, and populate with the following:
  - replace in [], and anything else that may need to change
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCalendarsUsageDescription": "We need access to your calendar in order to add upcoming classes to the calendar."
      },
      "supportsTablet": true,
      "bundleIdentifier": "[bundle-id created on app id section]",
      "buildNumber": "4"
    },
    "icon": "./assets/icon.png",
    "name": "[Studio Name]",
    "slug": "[the-slug]",
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "project": "[sentry-project]",
            "authToken": "[sentry-authtoken]",
            "organization": "dibs-technology-inc"
          }
        }
      ]
    },
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#2b2f33"
    },
    "privacy": "public",
    "updates": { "fallbackToCacheTimeout": 30000 },
    "version": "1.0.5",
    "platforms": ["ios"],
    "sdkVersion": "36.0.0",
    "description": "[Description]",
    "orientation": "portrait",
    "assetBundlePatterns": ["assets/*"]
  }
}
```

1. create an `app.json` object, and populate with the following:

```json
{
  "DIBS_HOST": "https://www.ondibs.com",
  "STUDIO_TZ": "[Timezone]",
  "S3_DIRNAME": "[s3-directory-location]",
  "SENTRY_DSN": "[sentry-dsn]",
  "STUDIO_FONT": "SourceSansPro",
  "STUDIO_COLOR": "[studio-color | #2b2f33]",
  "STUDIO_EMAIL": "[studio-email | info@ondibs.com]",
  "DIBS_STUDIO_ID": [studio_id],
  "LOADING_QUOTES": [
    // strings on a per-line basis
  ],
  "USER_TOKEN_KEY": "[user-token-key]",
  "DIBS_TERMS_LINK": "[https://www.ondibs.com/documents/terms-and-privacy.pdf]",
  "STUDIO_DATA_KEY": "[studio-data-key]",
  "STRIPE_PUBLIC_KEY": "pk_live_A88bToAQk67ecJSMySrlRiW1",
  "STUDIO_TERMS_LINK": "[sutdio-terms-link | https://www.ondibs.com/documents/terms-and-privacy.pdf]",
  "STUDIO_TEXT_COLOR": "[studio-text-color | #2b2f33]",
  "STUDIO_DROP_POLICY": "In order to receive credit back, please drop 12 hours before class time.",
  "RELEASE_CHANNEL_DEV": "[release-channel]-mobile",
  "RELEASE_CHANNEL_PROD": "[release-channel]-mobile-prod",
  "MAXIMUM_CART_QUANTITY": 4,
  "STUDIO_HIGHLIGHT_COLOR": "[studio-highlight-color | #f5f5f5]"
}
```
# test
1. `expo login` (if not logged in)
  - you will need an account for this step
  - you will also need the expo cli installed, `npm i -g expo-cli`
1. `npm i`
1. `run xcode ios simulator`
1. `npm run start`
1. click `Run on IOS Simulator` in chrome browser, or access via Expo app on IOS device by scanning the QR code

# promote
NOTE: you may need to install keys from:
  - (https://developer.apple.com/account/resources/certificates/list)
    - click on one and Download
NOTE2: THis should be done from a mac
1. run `npm run build:ios`
  1. fill in your apple credentials
  1. select `Expo handles all credentials. you can still provide overrides`
  1. select `Let Expo handle the process`
    1. If asked to reuse Apple Distribution Certificate, select `No, please create a new one`
      - NEED TO CHECK THIS, probably should use current, as only 3 allowed per project
  1. When asked to provide own Apple Push Notifications service key, select `Let Expo handle the process`
    1. If asked to reuse select `No, please create a new one`
      - NEED TO CHECK THIS
1. download generated .ipa
1. create app in app store if not created
  1. go to (https://appstoreconnect.apple.com/apps)
  1. Click + and New App
    1. select iOS
    1. Give a name
    1. Give a Primary Language
    1. Chose the bundleid you created before
    1. give a sku (can be same as the bundleid)
    1. select Full Access
    1. click Create
1. Add to xcode
  1. open xcode
  1. Select Xcode > Open Developer Tool > Application Loader
  1. Obtain the app specific password and put in

# upgrade
1. make sure to bump up `app.json > expo.version` to the next version
1. follow same steps as promote

# OTA Updates

Maybe later, visit (https://docs.expo.io/guides/configuring-ota-updates/) for more info.