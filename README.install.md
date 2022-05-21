A lot of help [here](https://levelup.gitconnected.com/react-native-how-to-publish-an-expo-app-to-testflight-debug-common-errors-90e427b4b5ea)

# Prereq
1. install xcode
2. install expo
  - `npm i -g expo-cli` or `sudo npm i -g expo-cli`
3. Go to [appleid.apple.com] and set up an Application-specific Password (Security > App-Specific Passwords) and store so you have it
4. Create the app id:
  - go to [developer.apple.com], Certificates, Identifiers, & Profiles > Idenfitiers > App IDs
  - click add button
  - select App IDs
  - give it a description, and a Bundle ID (Explicit) like `com.ondibs.[appname]app`
  - click Next, and Register
5. set up sentry
  - go to [https://sentry.io/settings/dibs-technology-inc/projects/]
  - create a new project
  - Set Platform to Mobile > Objective-C
  - Set project Name to a name you want to use, but make it lowercase and with dashes, this will be your `sentry-project`
  - Click Create
  - Click until getting back to project
  - Copy down the dsn in the following:

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
  - go to (https://sentry.io/settings/account/api/auth-tokens/) and save that `auth token` to be used as `sentry-authtoken`

# New Project

## add images
1. Add the icon of the project to `./assets/icon.png`
  - must be square and specifically 1024x1024
2. Add the splash screen of the project to `./assets/spash.png`
3. Add the main page background to `./assets/img/main-page.png`

## other config
1. Create a random value using [https://www.random.org/strings/?num=1&len=20&digits=on&loweralpha=on&unique=on&format=html&rnd=new]. This will be your `user-token-key`

2. create an `app.json` object, and populate with the following:
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
      "buildNumber": "1"
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
    "version": "1.0.0",
    "platforms": ["ios"],
    "sdkVersion": "36.0.0",
    "description": "[Description]",
    "orientation": "portrait",
    "assetBundlePatterns": ["assets/*"]
  }
}
```

3. create an `config.json` object, and populate with the following:

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
    - may need to add `sudo` to the front
2. `npm i`
3. `npm run start`
4. click `Run on IOS Simulator` in chrome browser, or access via Expo app on IOS device by scanning the QR code
  - you will need xcode installed with an ios simulator
  - you may need to run sudo `xcode-select -s /Applications/Xcode.app` the first time you run it

# promote
NOTE: you may need to install keys from:
  - [https://developer.apple.com/account/resources/certificates/list]
    - click on one and Download
NOTE2: This should be done from a mac


[NEW NOTES FROM MAY 2022]
1. RUN expo build:ios (or Android)
2. Use this for reference
https://docs.expo.dev/classic/building-standalone-apps/


[NOTES FROM PRIOR TO MAY 2022]

3. run `npm run build:ios`
  - fill in your apple credentials
  - select `Expo handles all credentials. you can still provide overrides`
  - select `Let Expo handle the process`
    - If asked to reuse Apple Distribution Certificate, select `No, please create a new one`
      - NEED TO CHECK THIS, probably should use current, as only 3 allowed per project
  - When asked to provide own Apple Push Notifications service key, select `Let Expo handle the process`
    - If asked to reuse select `No, please create a new one`
      - NEED TO CHECK THIS
4. download generated .ipa
5. create app in app store if not created
  - go to [https://appstoreconnect.apple.com/apps]
  - Click + and New App
    - select iOS
    - Give a name
    - Give a Primary Language
    - Chose the bundleid you created before
    - give a sku (can be same as the bundleid)
    - select Full Access
    - click Create
6. Deploy
  - Add to xcode (pre 11)
    - open xcode
    - Select Xcode > Open Developer Tool > Application Loader
    - Obtain the app specific password and put in along with email associated with app-specific password
    - Select Choose from bottom right
    - Find the .IPA you downloaded and click Open
    - Click Next
    - Click Next when complete
    - Click Done
  - Add to transporter (post 11)
    - download from app store if you don't have it
    - add .ipa to the transporter
    - hit Deliver button
# verification and testing
1. Go to (https://appstoreconnect.apple.com/apps) and find the app that was submitted
2. Click on Testflight, then on left App Store Connect Users or Add Groups to add testers
3. When ready and tested, click Submit for Review and follow any requests

# after deployment
1. Make sure the app_json and app_config_json fields for the studio in `dibs_studio` are updated to house the json files, for others to use
2. Upload the assets to the s3_ folder

# alternative setup
If the app_json and app_config_json fields in the `db.dibs_studio` are filled in, and there is a  valid s3 bucket with assets, you can run `node ./bin/download-assets.js --studio [studioid]` to get them

# upgrade
1. make sure to bump up `app.json > expo.version` if making software changes and `app.json > expo.ios.buildNumber` to the next version (`buildNumber` should be incremental to new builds for an object, but expo.version should be the version of code in major.minor.defect format)
2. follow same steps as promote

# OTA Updates

Maybe later, visit [https://docs.expo.io/guides/configuring-ota-updates/] for more info.
