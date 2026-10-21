import { Alert } from 'react-native';
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
    quality: 0.7,
    allowsEditing: true,
    aspect: square ? [1, 1] : [4, 3],
  });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

/** Ask "Camera or Library?", then return the chosen photo's local URI. */
export function pickPhoto({ square = false, title = 'Add a photo' }: PickOptions = {}): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert(title, undefined, [
      { text: '📷  Take photo',          onPress: () => launch('camera', square).then(resolve) },
      { text: '🖼️  Choose from library', onPress: () => launch('library', square).then(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
