import { ArrowRight, CalendarDays, MapPin, Plus, Users } from 'lucide-react-native';
import { Link } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGreeting } from '../hooks/use-greeting';

const eventImage =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85';

export function HomeScreen() {
  const greeting = useGreeting();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <CalendarDays color="#fff" size={19} strokeWidth={1.8} />
          </View>
          <Text style={styles.brand}>Vibe Planners</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>MC</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>WEDNESDAY, OCTOBER 1</Text>
          <Text style={styles.title}>
            {greeting},{'\n'}Mariana.
          </Text>
          <Text style={styles.subtitle}>A little progress makes a lovely event.</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your next event</Text>
          <Text style={styles.sectionMeta}>17 days away</Text>
        </View>

        <ImageBackground
          source={{ uri: eventImage }}
          imageStyle={styles.eventImage}
          style={styles.eventCard}
        >
          <View style={styles.imageShade} />
          <View style={styles.eventContent}>
            <Text style={styles.eventTag}>WEDDING</Text>
            <Text style={styles.eventTitle}>Mara & Luis</Text>
            <View style={styles.eventDetails}>
              <View style={styles.detailLine}>
                <CalendarDays color="#fff" size={15} />
                <Text style={styles.detailText}>October 18, 2026</Text>
              </View>
              <View style={styles.detailLine}>
                <MapPin color="#fff" size={15} />
                <Text style={styles.detailText}>Casa de la Luz, Oaxaca</Text>
              </View>
              <View style={styles.detailLine}>
                <Users color="#fff" size={15} />
                <Text style={styles.detailText}>86 guests</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.taskHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today’s focus</Text>
            <Text style={styles.taskSubtitle}>Three things to keep moving</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a task"
            style={styles.addButton}
          >
            <Plus color="#245747" size={20} />
          </Pressable>
        </View>

        <View style={styles.taskList}>
          <TaskRow title="Confirm the floral proposal" time="10:30 AM" />
          <TaskRow title="Send the seating draft to Mara" time="2:00 PM" />
          <TaskRow title="Review final guest count" time="4:15 PM" />
        </View>

        <Link href="/events" asChild>
          <Pressable accessibilityRole="button" style={styles.allEventsButton}>
            <Text style={styles.allEventsText}>View all events</Text>
            <ArrowRight color="#245747" size={17} />
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskRow({ title, time }: { title: string; time: string }) {
  return (
    <View style={styles.taskRow}>
      <View style={styles.taskDot} />
      <Text style={styles.taskTitle}>{title}</Text>
      <Text style={styles.taskTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f1' },
  page: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#245747',
  },
  brand: { flex: 1, color: '#24332b', fontFamily: 'Georgia', fontSize: 17, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f1dfd8',
  },
  avatarText: { color: '#764c40', fontSize: 11, fontWeight: '700' },
  intro: { paddingTop: 28, paddingBottom: 24 },
  eyebrow: { color: '#758078', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { marginTop: 10, color: '#202b25', fontFamily: 'Georgia', fontSize: 38, lineHeight: 43 },
  subtitle: { marginTop: 8, color: '#758078', fontSize: 13 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { color: '#29362f', fontSize: 15, fontWeight: '700' },
  sectionMeta: { color: '#557a64', fontSize: 11, fontWeight: '700' },
  eventCard: {
    minHeight: 250,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#66746c',
  },
  eventImage: { borderRadius: 12 },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 35, 29, 0.42)' },
  eventContent: { padding: 20 },
  eventTag: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.19)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  eventTitle: { marginTop: 9, color: '#fff', fontFamily: 'Georgia', fontSize: 29 },
  eventDetails: { gap: 7, marginTop: 13 },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { color: '#fff', fontSize: 11 },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 9,
  },
  taskSubtitle: { marginTop: 4, color: '#758078', fontSize: 11 },
  addButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#e5ede7',
  },
  taskList: { borderTopWidth: 1, borderTopColor: '#e0e5df' },
  taskRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e5df',
  },
  taskDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c08c65' },
  taskTitle: { flex: 1, color: '#354239', fontSize: 12 },
  taskTime: { color: '#89928b', fontSize: 10 },
  allEventsButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#d8e0d9',
    borderRadius: 7,
  },
  allEventsText: { color: '#245747', fontSize: 12, fontWeight: '700' },
});
