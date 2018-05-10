# Dibs Mobile App

Mobile version of the widget

This native application is created via React Native and Expo:

* [React Native](https://facebook.github.io/react-native/)
* [Expo](https://expo.io/)

## Getting started / Developing

### Setting Up Expo

* Download [Expo XDE](https://expo.io/tools#xde) for the OSX.
* Download the [Expo Client App](https://itunes.apple.com/app/apple-store/id982107779) which can be found by navigating to the App Store on your iPhone and searching for "Expo"

### Starting Expo

* Clone the 'dibs-mobile-app' repo
* Navigate to the root directory of the repo
* Install NPM packages
* Open your Expo XDE and register/login
* On the main screen of the XDE, select 'Open existing project...' and select the folder 'dibs-mobile-app'
* Your XDE will begin the loading process - ignore this and move on to the configurations section

### Expo Configurations

* Select the cogwheel icon under the 'Project, Restart, Help' buttons
* Hover over 'Host' and change the option to 'LAN' instead of 'Tunnel'
* Make sure 'Development Mode' is checked
* Click the 'Restart' button

### Running Expo

* Once you see this message: '
Project opened! You can now use the "Share" or "Device" buttons to view your project.', XDE has successfully loaded your project!
* In your iPhone, open up the Expo app
* Login with your credentials you signed up for on the XDE
* Click on 'Projects' on the bottom tab.
* If your XDE is running successfully, you will see your project appear under the 'Recently in Development' section.
* Select your project and let everything load.
* You should now see the current state of your project running natively on the iPhone!

### Testing Expo

* Make a simple change to the codebase
* If Expo is working, your project will rebuild upon saving.

### Debugging

* The [React Native Debugger](https://github.com/jhen0409/react-native-debugger) is a nice tool which lets you access the console, Redux devtools, and React devtools
* You can find instructions on how to integrate RND with Expo [here](https://www.gravitywell.co.uk/latest/rd/posts/react-native-debugger-expo-awesome/).
* Once you finish following instructions to integrate RND with Expo, you can press `ctrl + cmd + z` to toggle the inspector
which will reveal components in the React component tree and will also show the CSS box
* To start the debugger (before launching Expo) run the following command: `open "rndebugger://set-debugger-loc?host=localhost&port=19001"`


### Troubleshooting

* If your Expo app is no longer updating upon save, shake the phone and Expo will change to a menu screen. Select 'Restart Build'
* If your Expo desktop app is not responding, simply restart the build.
* If you save multiple times while Expo is rebuilding, you will need to save again to trigger another build once the initial build has finished.
* When React Native gives you the red screen of death due to bugs, you may need to manually select 'Restart Build' at the bottom of the screen once the bugs have been fixed.








