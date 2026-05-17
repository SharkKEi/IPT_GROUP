import { useState } from 'react';
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
    const userMsg = { id: Date.now().toString(), from: 'user', text };
    setMessages((m) => [...m, userMsg]);
    try {
      const data = await apiRequest('/accounts/api/chatbot/', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-b`, from: 'bot', text: data.reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-e`, from: 'bot', text: 'Could not reach the server.' },
      ]);
    }
  };

  return (
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
});
