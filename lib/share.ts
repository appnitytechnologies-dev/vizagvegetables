import { Platform, Share, Alert } from 'react-native';
import { File as FSFile, Paths } from 'expo-file-system';
import RNShare from 'react-native-share';

interface ShareProductParams {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string | null;
}

/** Shares a product's image together with its name and a link to it —
 *  expo-sharing can't attach caption text alongside a file, and React
 *  Native's core Share API can't attach a local image on Android, so
 *  react-native-share is used to combine both in one share sheet. */
export async function shareProduct({ id, name, price, unit, imageUrl }: ShareProductParams) {
  const message = `🛒 ${name} — ₹${Math.round(price)}/${unit}\nOrder fresh from YZAG Fresh!\n\nhttps://www.yzagfresh.com/shop/${id}`;

  try {
    if (Platform.OS !== 'web' && imageUrl) {
      const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const localFile = await FSFile.downloadFileAsync(
        imageUrl,
        new FSFile(Paths.cache, `share_${id}.${ext}`)
      );
      await RNShare.open({
        title: name,
        message,
        url: localFile.uri,
        failOnCancel: false,
      });
      return;
    }
    // Web, or no image available: share text via native share sheet / navigator.share
    await Share.share({ message });
  } catch (err: any) {
    Alert.alert('Share failed', 'Could not share this item right now.');
  }
}
