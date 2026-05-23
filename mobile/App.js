import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StudentsScreen from './src/screens/StudentsScreen';
<<<<<<< HEAD
=======
import SubjectsScreen from './src/screens/SubjectsScreen';
import SectionsScreen from './src/screens/SectionsScreen';
import EnrollmentsScreen from './src/screens/EnrollmentsScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import UsersScreen from './src/screens/UsersScreen';
>>>>>>> 56b74d6 (Updated project code)
import ChatbotScreen from './src/screens/ChatbotScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isLoggedIn, booting } = useAuth();

  if (booting) {
    return (
<<<<<<< HEAD
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e0b4d' }}>
=======
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16092f' }}>
>>>>>>> 56b74d6 (Updated project code)
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
<<<<<<< HEAD
        headerStyle: { backgroundColor: '#1e0b4d' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#130b39' },
=======
        headerStyle: { backgroundColor: '#16092f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: '#16092f' },
>>>>>>> 56b74d6 (Updated project code)
      }}
    >
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Students" component={StudentsScreen} />
<<<<<<< HEAD
=======
          <Stack.Screen name="Subjects" component={SubjectsScreen} />
          <Stack.Screen name="Sections" component={SectionsScreen} />
          <Stack.Screen name="Enrollments" component={EnrollmentsScreen} />
          <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: 'Enrollment Summary' }} />
          <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'User Roles' }} />
>>>>>>> 56b74d6 (Updated project code)
          <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'Assistant' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
