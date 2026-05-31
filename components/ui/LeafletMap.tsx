import { WebView } from 'react-native-webview';

interface Props {
  html: string;
  style?: object;
}

export default function LeafletMap({ html, style }: Props) {
  return (
    <WebView
      style={[{ flex: 1 }, style]}
      source={{ html }}
      scrollEnabled={false}
      javaScriptEnabled
      originWhitelist={['*']}
    />
  );
}
