import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppContext } from '../context/AppContext';

const Tab = createBottomTabNavigator();

const NAVY = '#0f1f3d';
const INACTIVE = '#8a9bbf';

function TabIcon({ iconName, label, focused }) {
  const { theme } = useAppContext();
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? NAVY : INACTIVE}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? theme.text : INACTIVE },
          focused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabNavigator() {
  const { theme } = useAppContext();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.tabBorder }],
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName={focused ? 'home' : 'home-outline'} label="Home" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName={focused ? 'search' : 'search-outline'} label="Search" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Search tab',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName={focused ? 'person-circle' : 'person-circle-outline'} label="Profile" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    borderTopWidth: 1,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabBarItem: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 80,
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
