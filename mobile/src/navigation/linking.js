import * as Linking from 'expo-linking';

// Deep link: skilllearn://course/react, skilllearn://category/design, dst.
// Di Expo Go prefiksnya exp://<host>/--/ (dibuat otomatis oleh createURL).
const num = (v) => Number(v);

export const linking = {
  prefixes: [Linking.createURL('/'), 'skilllearn://'],
  config: {
    screens: {
      Splash: 'welcome',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      Main: {
        screens: {
          HomeTab: { screens: { Home: '', Category: 'category/:id' } },
          SearchTab: 'search',
          ProfileTab: 'profile',
        },
      },
      CourseDetail: 'course/:slug',
      Article: { path: 'course/:slug/article/:lessonIndex', parse: { lessonIndex: num } },
      Quiz: { path: 'course/:slug/quiz/:lessonIndex', parse: { lessonIndex: num } },
      Practice: { path: 'course/:slug/practice/:lessonIndex', parse: { lessonIndex: num } },
      EditProfile: 'profile/edit',
    },
  },
};
