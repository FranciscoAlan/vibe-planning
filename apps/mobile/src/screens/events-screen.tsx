import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react-native';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const events = [
  { title: 'Mara & Luis', type: 'Wedding', date: 'October 18, 2026', location: 'Oaxaca' },
  {
    title: 'Casa Nopal launch',
    type: 'Brand event',
    date: 'October 24, 2026',
    location: 'Mexico City',
  },
  {
    title: 'Elena turns thirty',
    type: 'Private dinner',
    date: 'November 02, 2026',
    location: 'Oaxaca',
  },
];

export function EventsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <Link href="/" asChild>
          <Pressable accessibilityRole="button" style={styles.backButton}>
            <ArrowLeft color="#245747" size={18} />
            <Text style={styles.backText}>Overview</Text>
          </Pressable>
        </Link>
        <Text style={styles.eyebrow}>YOUR WORKSPACE</Text>
        <Text style={styles.title}>All events</Text>
        <Text style={styles.subtitle}>Your upcoming celebrations, in one place.</Text>
        <View style={styles.list}>
          {events.map((event) => (
            <View key={event.title} style={styles.eventRow}>
              <View style={styles.iconBox}>
                <CalendarDays color="#245747" size={18} />
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventType}>{event.type}</Text>
                <View style={styles.metadata}>
                  <Text style={styles.metadataText}>{event.date}</Text>
                  <MapPin color="#829087" size={12} />
                  <Text style={styles.metadataText}>{event.location}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f1' },
  page: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40 },
  backText: { color: '#245747', fontSize: 12, fontWeight: '700' },
  eyebrow: { marginTop: 30, color: '#758078', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { marginTop: 8, color: '#202b25', fontFamily: 'Georgia', fontSize: 34 },
  subtitle: { marginTop: 6, color: '#758078', fontSize: 12 },
  list: { marginTop: 25, borderTopWidth: 1, borderTopColor: '#e0e5df' },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e5df',
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#e5ede7',
  },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { color: '#29362f', fontSize: 14, fontWeight: '700' },
  eventType: { color: '#758078', fontSize: 11 },
  metadata: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metadataText: { color: '#829087', fontSize: 10 },
});
