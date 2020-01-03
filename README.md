Table of Contents
=================

   * [Installation](#installation)
   * [Setting Up Initial Project Files](#setting-up-initial-project-files)
   * [Running Expo](#running-expo)
   * [Building the App](#building-the-app)
   * [Submitting to the App Store](#submitting-to-the-app-store)
   * [Over The Air Updates](#over-the-air-updates)
   * [Common Problems](#common-problems)
   * [Debugging](#debugging)
   * [Troubleshooting](#troubleshooting)

Installation
============

This is a Native iOS/Android whitelabel application for Dibs' studio partners.

Shoutout to [React Native](https://facebook.github.io/react-native/) and [Expo](https://expo.io/)!

You can develop using Expo's GUI app called 'Expo XDE', or use their CLI. Expo takes care of all bundling, optimizations, and publishing of the React Native codebase.

To use their GUI, click [here](https://expo.io/tools#xde).

Or install the CLI:

```bash
$ npm i -g exp
```

If you are developing using a real phone (recommended), you'll need to download the [Expo Client App](https://itunes.apple.com/app/apple-store/id982107779) which can be found by navigating to the App Store on your iPhone and searching for ```Expo```.

You can also use the simulator provided by XCode. Please note that while the simulator is fairly accurate in terms of emulating a proper device experience, you will need to test on an actual device due to potential simulator bugs/glitches. Make sure you also have the latest version of XCode installed before proceeding.

To run the simulator using the XDE, simply select the option to open the current project in the simulator.

If you are using the CLI and would like to use the simulator:

```bash
$ exp start -i --dev
```

Setting Up Initial Project Files
=============

Clone the ```dibs-mobile-app``` repo, then navigate to the root directory of the repo.

Run the following:

```bash
$ npm i
```

Before you run the app, there are a few configuration files you need in your repo.

Run the following:

Create the ```env``` file for API keys used during the building and publishing phases of the app

```bash
$ touch .env
```

The ```app.json``` file is normally created when initializing a new Expo project. However in our case, we generate different
config files based on the studio, so this file is git ignored.

```bash
$ touch app.json
```

The ```config.json``` file is used by the app for studio specific information.

```bash
$ touch config.json
```

Once you have done this, go to the Dibs database and look up the studio you want to load in the app.
This information is located in the ```dibs_studios``` table under the ```app_json``` and ```app_config_json``` columns.

Copy the json file from ```app_json``` and paste it into your ```app.json``` file.
Copy the json file from ```app_config_json``` and pase it into your ```config.json``` file.

In your ```env``` file, create key entries named ```DATABASE_URL```, ```AWS_ACCESS_KEY_ID```, and ```AWS_SECRET_ACCESS_KEY```.
You should have the values for those keys already. If not, ask another dev.

Once these three files are setup, you should be ready to start expo! Woot!

Running Expo
============

If you are using the XDE - do the following:

- Open your Expo XDE and register/login.
- On the main screen of the XDE, select ```Open existing project...``` and select the folder ```dibs-mobile-app```.
- Your XDE will begin the loading process - ignore this and move on to the configurations section.

If you are using the CLI, simply run:

```bash
$ exp start --dev
```

NOTE: This is assuming that you are using an actual phone, if you need to use the simulator - add an ```-i``` to the command.

Once you see this message: ```Project opened! You can now use the "Share" or "Device" buttons to view your project.```, Expo has successfully loaded your project!

This message will appear in the logs whether you are running the XDE or the CLI.

If you are using a real phone, do the following:

- In your iPhone, open up the Expo app.
- Login with your credentials you signed up for on the XDE.
- Click on 'Projects' on the bottom tab.
- If your XDE is running successfully, you will see your project appear under the 'Recently in Development' section.
- Select your project and let everything load.
- You should now see the current state of your project running natively on the iPhone!
- Make a simple change to the codebase.
- If Expo is working, your project will rebuild upon saving.

If you opted to use the simulator, wait for it to open on your screen and follow the instructions to login and choose your project.


Building the App
================

Run `node ./bin/publish.js -s [studio-id] [-d|--downloadAssets] [-c|--downloadConfigs] [-p|--prod]`

`-c` - downloads configs from db
`-d` - downloads assets from S3
`-p` - sets as prod deployment

NOTE: Make sure that the `app.json`.`expo`.`sdkVersion` is set to `36.0.0` or above.

Once the process has begun, Expo will ask if you want to provide the certifictes or have Expo generate them for you. Choose to have expo handle everything.
When the bundle has finished building, you will be ready to submit to Testflight and eventually the App Store.

NOTE: When pushing new builds to the app store, do not forget to tick the version number in the ```app.json```. If not, your app build file will
be rejected by Apple's Application Loader.

Submitting to the App Store
===========================

IN PROGRESS...Stay tuned.

Over The Air Updates
==================

Once you have a build in Testflight or the App Store, Expo provides the ability to publish Over The Air updates. This means that there is no need to resubmit to the App Store
for every little change or feature. There are however a few things that cannot be pushed via OTA, including the splash screen and the app icon.

We use an automated script to help us perform over the air updates.
Simply run the following command:

```bash
$ node ./bin/publish --studios [dibs_studio_id] --prod
```

The `--studios` (or `-s`) option determines which studios you are publishing for. Don't forget it's the ```dibs_studio_id``` and not the ```studioid```.
You can also run the script with the `--all` option to publish
over the air updates to all studios in series (this takes a long to run).

_You must use either `--studios` or `--all` to run the publish._

TODO: multi-studio updates by `dibs_studio_id`s and have updates be in parallel.

and the updates will be automatically pushed to that studio's **production** app.
Run the script without the `--prod` option (which can also) to publish to the
staging (Test Flight) environments.

In the case that you want to revert the publish, simply remove the code that was published and run the command again.
Once an updates has been pushed OTA, the app will automatically check for and download the updates the next time it opens.

Run `node ./bin/publish --help` for more information.

Common Problems
===============

Downloading/updating/bringing in a substantial amount of new code such as installing new packages or pulling in large amounts of changes from a branch
may result in a ```Metro Bundler Error```. In this case, you'll need to restart the XDE or CLI. If you are using a phone, restart the Expo Client App. If you are on the
simulator, restart the simulator.


Debugging
=========

Expo provides excellent tools for debugging in React Native.

- The [React Native Debugger](https://github.com/jhen0409/react-native-debugger) is a nice tool which lets you access the console, Redux devtools, and React devtools
- You can find instructions on how to integrate RND with Expo [here](https://www.gravitywell.co.uk/latest/rd/posts/react-native-debugger-expo-awesome/).
- Once you finish following instructions to integrate RND with Expo, you can press `ctrl + cmd + z` to toggle the inspector. This will reveal components in the React component tree and will also show the CSS box
- To start the debugger run the following command: `open "rndebugger://set-debugger-loc?host=localhost&port=PORT"` (the port may vary, check Expo for port number)


Troubleshooting
===============

- If your Expo app is no longer updating upon save, shake the phone and Expo will change to a menu screen. Select 'Restart Build'
- If your Expo desktop app is not responding, simply restart the build.
- If you save multiple times while Expo is rebuilding, you will need to save again to trigger another build once the initial build has finished.
- When React Native gives you the red screen of death due to bugs, you may need to manually select 'Restart Build' at the bottom of the screen once the bugs have been fixed.








