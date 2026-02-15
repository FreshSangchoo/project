/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/views/App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
