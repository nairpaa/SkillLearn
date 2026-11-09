import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { HomeIcon, SearchIcon, UserIcon } from '../components/Icons';
import { useInsets } from '../hooks/useInsets';

const ICONS = { HomeTab: HomeIcon, SearchTab: SearchIcon, ProfileTab: UserIcon };
const LABELS = { HomeTab: 'Home', SearchTab: 'Search', ProfileTab: 'Profile' };

// Tab bar custom sesuai MobileTabBar.dc.html: putih, garis atas, 3 tab sama lebar, ikon 22 + label 11/600
export default function TabBar({ state, navigation }) {
  const insets = useInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.inkMuted;
        const Icon = ICONS[route.name];
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          // Tap tab yang sedang aktif → balik ke layar paling atas stack-nya (mis. dari Category ke Home)
          else if (focused && !event.defaultPrevented && route.state?.index > 0)
            navigation.dispatch({ ...StackActions.popToTop(), target: route.state.key });
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[route.name]}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
          >
            {Icon ? <Icon size={22} color={color} /> : null}
            <Text style={[styles.label, { color }]}>{LABELS[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 44 },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
});
