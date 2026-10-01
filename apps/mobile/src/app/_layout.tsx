import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { rootStackOptions } from '../navigation/stack-options';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={rootStackOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="events" options={{ title: 'Your events' }} />
      </Stack>
    </>
  );
}
