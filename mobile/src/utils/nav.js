import { StackActions } from '@react-navigation/native';

// Di React Navigation 7, navigate() ke layar yang sudah ada di bawah stack akan MENUMPUK layar baru
// (bukan kembali). Jadi untuk "balik ke Home" stack tab Home di-pop dulu secara eksplisit.
function popHomeStack(navigation, tabState) {
  const home = tabState?.routes?.find((r) => r.name === 'HomeTab');
  if (home?.state?.key && home.state.index > 0) {
    navigation.dispatch({ ...StackActions.popToTop(), target: home.state.key });
  }
}

// Untuk layar di root stack (Course Detail, lesson, Edit Profile)
export function goHome(navigation) {
  const root = navigation.getState();
  const main = root?.routes?.find((r) => r.name === 'Main');
  popHomeStack(navigation, main?.state);
  navigation.popTo('Main', { screen: 'HomeTab' });
}

// Untuk layar di dalam tab (Search, Profile)
export function goHomeTab(navigation) {
  popHomeStack(navigation, navigation.getState());
  navigation.navigate('HomeTab');
}
