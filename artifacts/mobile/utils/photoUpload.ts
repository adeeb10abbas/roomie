import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, getStoredToken } from './api';

export async function pickAndCompressPhoto(source: 'gallery' | 'camera'): Promise<string | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return null;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to pick a photo.');
      return null;
    }
  }

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
  }

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  const ImageManipulator = await import('expo-image-manipulator').catch(() => null);
  if (!ImageManipulator) {
    return asset.uri;
  }

  const manipResult = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 800 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );

  return manipResult.uri;
}

export async function uploadPhoto(localUri: string): Promise<string> {
  const token = await getStoredToken();

  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'photo.jpg';
  formData.append('photo', {
    uri: localUri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (Platform.OS !== 'web') headers['X-Client-Type'] = 'native';

  const res = await fetch(`${API_BASE}/profile/photo`, {
    method: 'POST',
    headers,
    body: formData,
    ...(Platform.OS === 'web' ? { credentials: 'include' } : {}),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { photoUrl: string };
  return data.photoUrl;
}

export function showPhotoPickerSheet(onPick: (source: 'gallery' | 'camera') => void) {
  Alert.alert(
    'Change profile photo',
    '',
    [
      { text: 'Take Photo', onPress: () => onPick('camera') },
      { text: 'Choose from Library', onPress: () => onPick('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ],
  );
}
