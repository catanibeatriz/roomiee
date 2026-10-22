import { Platform } from 'react-native';
import { Alert } from '@/lib/alert';
import * as ImagePicker from 'expo-image-picker';

type PickOptions = { square?: boolean; title?: string };

async function launch(source: 'camera' | 'library', square: boolean): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Allow camera access for Expo Go in your iPhone Settings.');
      return null;
    }
  }
  const run = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const result = await run({
    mediaTypes: ['images'],
    quality: 0.35,
    allowsEditing: true,
    aspect: square ? [1, 1] : [4, 3],
    base64: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  return toDataUrl(result.assets[0]);
}

/**
 * Photos are stored in the database as compressed data URLs so they belong to
 * the house (and its row-level security) and show up on every device.
 */
export function toDataUrl(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.uri.startsWith('data:')) return asset.uri;
  if (asset.base64) return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
  return asset.uri;
}

/** Ask "Camera or Library?", then return the chosen photo's local URI. */
export function pickPhoto({ square = false, title = 'Add a photo' }: PickOptions = {}): Promise<string | null> {
  // The browser's file picker already offers "Take photo" on phones.
  if (Platform.OS === 'web') return launch('library', square);
  return new Promise((resolve) => {
    Alert.alert(title, undefined, [
      { text: '📷  Take photo',          onPress: () => launch('camera', square).then(resolve) },
      { text: '🖼️  Choose from library', onPress: () => launch('library', square).then(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
