import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * EBE mobile — hosts the ORB web face full-screen.
 *
 * ⚠️ Point this at your running EBE server. Your phone can't reach "localhost" — use your
 * computer's LAN IP (same Wi-Fi), e.g. http://192.168.1.20:8080. Find it on the computer with:
 *   Windows:  ipconfig   (IPv4 Address)
 *   Mac:      ipconfig getifaddr en0
 * Or set it to your deployed URL once EBE is hosted.
 */
const EBE_URL = 'http://192.168.1.20:8080';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webRef = useRef(null);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {!error ? (
        <WebView
          ref={webRef}
          source={{ uri: EBE_URL }}
          style={styles.web}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          allowsProtectedMedia
          // grant mic for voice features (Android)
          onPermissionRequest={(e) => { try { e.grant(e.resources); } catch (_) {} }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.title}>EBE can't reach its server</Text>
          <Text style={styles.body}>Make sure EBE is running and EBE_URL points to your computer's LAN IP (not localhost).</Text>
          <Text style={styles.url}>{EBE_URL}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => { setError(false); setLoading(true); webRef.current && webRef.current.reload(); }}>
            <Text style={styles.btnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading && !error && (
        <View style={styles.center}><ActivityIndicator size="large" color="#7BB3DF" /></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05080f' },
  web: { flex: 1, backgroundColor: '#05080f' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#05080f' },
  title: { color: '#bdf3ff', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  body: { color: '#9fd0e6', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  url: { color: '#7BB3DF', fontSize: 13, marginTop: 10 },
  btn: { marginTop: 22, borderColor: '#5adcff', borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 26 },
  btnText: { color: '#bdf3ff', letterSpacing: 2 }
});
