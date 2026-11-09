import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';
import TabBar from './TabBar';
import BootScreen from '../screens/BootScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CategoryScreen from '../screens/CategoryScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import ArticleScreen from '../screens/ArticleScreen';
import QuizScreen from '../screens/QuizScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const noHeader = { headerShown: false };

// Category ada di dalam tab Home supaya tab bar tetap kelihatan (sesuai desain M06)
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ ...noHeader, contentStyle: { backgroundColor: colors.page } }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Category" component={CategoryScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ ...noHeader, sceneStyle: { backgroundColor: colors.page } }}>
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { status, sessionExpired } = useAuth();
  if (status === 'unknown') return <BootScreen />;

  if (status === 'authed') {
    return (
      <Stack.Navigator screenOptions={{ ...noHeader, contentStyle: { backgroundColor: colors.white } }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="Article" component={ArticleScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ contentStyle: { backgroundColor: colors.page } }} />
        <Stack.Screen name="Practice" component={PracticeScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    );
  }

  // Sesi kedaluwarsa → langsung ke Login (dengan banner), selain itu mulai dari Splash
  return (
    <Stack.Navigator
      key={sessionExpired ? 'guest-expired' : 'guest'}
      initialRouteName={sessionExpired ? 'Login' : 'Splash'}
      screenOptions={{ ...noHeader, contentStyle: { backgroundColor: colors.white }, animationTypeForReplace: 'pop' }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ contentStyle: { backgroundColor: colors.primary } }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
