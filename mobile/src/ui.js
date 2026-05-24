import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius } from './theme';

const bg = require('./assets/login_background.png');

export function Screen({ title, subtitle, children, scroll = true, footer }) {
  const Body = scroll ? ScrollView : View;
  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <Body
        style={styles.body}
        contentContainerStyle={scroll ? styles.content : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {(title || subtitle) && (
          <View style={styles.header}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
        {children}
      </Body>
      {footer}
    </ImageBackground>
  );
}

export function GlassCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppInput({ label, style, ...props }) {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="rgba(255,255,255,0.38)"
      />
    </View>
  );
}

export function AppButton({ title, onPress, loading, disabled, tone = 'primary', style }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        tone === 'danger' && styles.dangerButton,
        tone === 'ghost' && styles.ghostButton,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

export function LinkButton({ title, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text style={styles.link}>{title}</Text>
    </Pressable>
  );
}

export function AlertBox({ type = 'error', children }) {
  if (!children) return null;
  return (
    <View style={[styles.alert, type === 'success' && styles.successAlert, type === 'info' && styles.infoAlert]}>
      <Text style={styles.alertText}>{children}</Text>
    </View>
  );
}

export function Badge({ children, tone = 'default' }) {
  return (
    <View style={[styles.badge, tone === 'success' && styles.badgeSuccess, tone === 'danger' && styles.badgeDanger]}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function DataRow({ title, subtitle, meta, actions }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
      </View>
      {actions ? <View style={styles.rowActions}>{actions}</View> : null}
    </View>
  );
}

export function SmallButton({ title, onPress, tone = 'ghost', disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.smallButton,
        tone === 'danger' && styles.smallDanger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.smallText, tone === 'danger' && { color: colors.danger }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 8, 55, 0.82)',
  },
  body: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  header: { marginTop: 12, marginBottom: 18 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 14,
  },
  inputWrap: { marginBottom: 12 },
  label: { color: colors.muted, fontWeight: '700', marginBottom: 7, fontSize: 13 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: 4,
  },
  dangerButton: { backgroundColor: 'rgba(244, 63, 94, 0.32)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.45)' },
  ghostButton: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.88 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  link: { color: '#c7d2fe', textAlign: 'center', fontWeight: '700', marginTop: 16, fontSize: 15 },
  alert: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)',
    backgroundColor: 'rgba(248,113,113,0.12)',
    padding: 14,
    marginBottom: 14,
  },
  successAlert: { borderColor: 'rgba(134,239,172,0.5)', backgroundColor: 'rgba(34,197,94,0.12)' },
  infoAlert: { borderColor: 'rgba(96,165,250,0.45)', backgroundColor: 'rgba(59,130,246,0.12)' },
  alertText: { color: colors.text, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeSuccess: { backgroundColor: 'rgba(34,197,94,0.16)', borderColor: 'rgba(134,239,172,0.35)' },
  badgeDanger: { backgroundColor: 'rgba(244,63,94,0.16)', borderColor: 'rgba(251,113,133,0.35)' },
  badgeText: { color: colors.text, fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  sectionTitle: { color: colors.faint, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '800', marginBottom: 10, marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 13,
    gap: 10,
  },
  rowTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  rowSub: { color: colors.muted, marginTop: 3 },
  rowMeta: { color: colors.faint, marginTop: 3, fontSize: 12 },
  rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallButton: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  smallDanger: { backgroundColor: 'rgba(251,113,133,0.10)' },
  smallText: { color: '#c7d2fe', fontWeight: '800', fontSize: 12 },
});
