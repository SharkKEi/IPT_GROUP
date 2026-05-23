import { useState } from 'react';
<<<<<<< HEAD
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from '../api';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { id: '0', from: 'bot', text: 'Ask me about enrollment, students, or your account.' },
  ]);
  const [input, setInput] = useState('');

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
=======
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AppButton, AppInput, GlassCard, Screen } from '../ui';
import { colors } from '../theme';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { id: '0', from: 'bot', text: 'Hi! I can answer questions about enrollment, students, subjects, and your account.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
>>>>>>> 56b74d6 (Updated project code)
    const userMsg = { id: Date.now().toString(), from: 'user', text };
    setMessages((m) => [...m, userMsg]);
    try {
      const data = await apiRequest('/accounts/api/chatbot/', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
<<<<<<< HEAD
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-b`, from: 'bot', text: data.reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-e`, from: 'bot', text: 'Could not reach the server.' },
      ]);
=======
      setMessages((m) => [...m, { id: `${Date.now()}-b`, from: 'bot', text: data.reply || 'No reply.' }]);
    } catch (e) {
      setMessages((m) => [...m, { id: `${Date.now()}-e`, from: 'bot', text: e.message || 'Could not reach the server.' }]);
    } finally {
      setSending(false);
>>>>>>> 56b74d6 (Updated project code)
    }
  };

  return (
<<<<<<< HEAD
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'user' ? styles.user : styles.bot]}>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor="#888"
        />
        <Pressable style={styles.send} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
=======
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title="Assistant" subtitle="Chatbot request is sent to Django API." scroll={false}>
        <View style={styles.wrap}>
          <GlassCard style={styles.chatCard}>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <View style={[styles.bubble, item.from === 'user' ? styles.user : styles.bot]}><Text style={styles.text}>{item.text}</Text></View>}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          </GlassCard>
          <GlassCard style={styles.inputCard}>
            <AppInput value={input} onChangeText={setInput} placeholder="Type a message…" editable={!sending} onSubmitEditing={send} />
            <AppButton title="Send" onPress={send} loading={sending} disabled={!input.trim()} />
          </GlassCard>
        </View>
      </Screen>
>>>>>>> 56b74d6 (Updated project code)
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  flex: { flex: 1 },
  list: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 8 },
  user: { alignSelf: 'flex-end', backgroundColor: '#4f46e5' },
  bot: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)' },
  text: { color: '#fff' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#fff',
  },
  send: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '600' },
=======
  wrap: { flex: 1, padding: 16 },
  chatCard: { flex: 1, marginBottom: 10 },
  inputCard: { marginBottom: 6 },
  bubble: { maxWidth: '86%', borderRadius: 18, padding: 12, marginBottom: 8 },
  user: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bot: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.10)' },
  text: { color: colors.text, lineHeight: 20 },
>>>>>>> 56b74d6 (Updated project code)
});
