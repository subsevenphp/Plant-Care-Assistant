import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  IconButton,
  Chip,
  ActivityIndicator,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { plantService } from '../services/plantService';

type Props = NativeStackScreenProps<MainStackParamList, 'AddPlant'>;

interface AddPlantFormValues {
  name: string;
  species: string;
  notes: string;
  wateringFrequency: string;
  location: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Plant name must be at least 2 characters')
    .max(50, 'Plant name must be less than 50 characters')
    .required('Plant name is required'),
  species: Yup.string()
    .max(100, 'Species name must be less than 100 characters'),
  wateringFrequency: Yup.number()
    .min(1, 'Watering frequency must be at least 1 day')
    .max(365, 'Watering frequency must be less than 365 days')
    .required('Watering frequency is required'),
  location: Yup.string()
    .max(50, 'Location must be less than 50 characters'),
  notes: Yup.string()
    .max(500, 'Notes must be less than 500 characters'),
});

const initialValues: AddPlantFormValues = {
  name: '',
  species: '',
  notes: '',
  wateringFrequency: '7',
  location: '',
};

export default function AddPlantScreen({ navigation }: Props) {
  const theme = useTheme();
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddPlant = async (values: AddPlantFormValues, { setSubmitting }: any) => {
    try {
      const plantData = {
        name: values.name.trim(),
        species: values.species.trim() || undefined,
        notes: values.notes.trim() || undefined,
        wateringFrequency: Number(values.wateringFrequency),
        location: values.location.trim() || undefined,
        imageUri,
      };

      await plantService.createPlant(plantData);
      showSnackbar('Plant added successfully!');
      
      // Navigate back after a short delay to show the success message
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      console.error('Error adding plant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add plant. Please try again.';
      showSnackbar(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return { cameraStatus, libraryStatus };
  };

  const pickImage = async () => {
    try {
      const { libraryStatus } = await requestPermissions();
      
      if (libraryStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showSnackbar('Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { cameraStatus } = await requestPermissions();
      
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showSnackbar('Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
      ]
    );
  };

  const removeImage = () => {
    setImageUri(null);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor={theme.colors.onSurface}
          />
          <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Add Plant
          </Title>
          <View style={{ width: 40 }} />
        </View>

        {/* Photo Section */}
        <Card style={styles.photoCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Plant Photo
            </Text>
            <View style={styles.photoContainer}>
              {imageUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.plantImage} />
                  <IconButton
                    icon="close-circle"
                    size={32}
                    onPress={removeImage}
                    iconColor={theme.colors.error}
                    style={styles.removeImageButton}
                  />
                </View>
              ) : (
                <View style={styles.placeholderImage}>
                  <IconButton
                    icon="camera-plus"
                    size={48}
                    iconColor={theme.colors.primary}
                    onPress={showImageOptions}
                  />
                  <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                    Add a photo of your plant
                  </Text>
                </View>
              )}
            </View>
            {!imageUri && (
              <View style={styles.photoActions}>
                <Button
                  mode="outlined"
                  onPress={takePhoto}
                  icon="camera"
                  style={styles.photoButton}
                >
                  Take Photo
                </Button>
                <Button
                  mode="outlined"
                  onPress={pickImage}
                  icon="image"
                  style={styles.photoButton}
                >
                  Gallery
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleAddPlant}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View>
                  <TextInput
                    label="Plant Name *"
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    mode="outlined"
                    style={styles.input}
                    error={touched.name && !!errors.name}
                    disabled={isSubmitting}
                    left={<TextInput.Icon icon="leaf" />}
                    placeholder="e.g., My Monstera"
                  />
                  {touched.name && errors.name && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.name}
                    </Text>
                  )}

                  <TextInput
                    label="Species"
                    value={values.species}
                    onChangeText={handleChange('species')}
                    onBlur={handleBlur('species')}
                    mode="outlined"
                    style={styles.input}
                    error={touched.species && !!errors.species}
                    disabled={isSubmitting}
                    left={<TextInput.Icon icon="flower" />}
                    placeholder="e.g., Monstera deliciosa"
                  />
                  {touched.species && errors.species && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.species}
                    </Text>
                  )}

                  <TextInput
                    label="Watering Frequency (days) *"
                    value={values.wateringFrequency}
                    onChangeText={handleChange('wateringFrequency')}
                    onBlur={handleBlur('wateringFrequency')}
                    mode="outlined"
                    style={styles.input}
                    error={touched.wateringFrequency && !!errors.wateringFrequency}
                    disabled={isSubmitting}
                    left={<TextInput.Icon icon="water" />}
                    keyboardType="numeric"
                    placeholder="e.g., 7"
                  />
                  {touched.wateringFrequency && errors.wateringFrequency && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.wateringFrequency}
                    </Text>
                  )}

                  <TextInput
                    label="Location"
                    value={values.location}
                    onChangeText={handleChange('location')}
                    onBlur={handleBlur('location')}
                    mode="outlined"
                    style={styles.input}
                    error={touched.location && !!errors.location}
                    disabled={isSubmitting}
                    left={<TextInput.Icon icon="map-marker" />}
                    placeholder="e.g., Living Room"
                  />
                  {touched.location && errors.location && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.location}
                    </Text>
                  )}

                  <TextInput
                    label="Notes"
                    value={values.notes}
                    onChangeText={handleChange('notes')}
                    onBlur={handleBlur('notes')}
                    mode="outlined"
                    style={styles.textArea}
                    error={touched.notes && !!errors.notes}
                    disabled={isSubmitting}
                    left={<TextInput.Icon icon="text" />}
                    multiline
                    numberOfLines={4}
                    placeholder="Any special care instructions or notes..."
                  />
                  {touched.notes && errors.notes && (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {errors.notes}
                    </Text>
                  )}

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                  >
                    {isSubmitting ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.loadingText}>Adding Plant...</Text>
                      </View>
                    ) : (
                      'Add Plant'
                    )}
                  </Button>
                </View>
              )}
            </Formik>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  photoCard: {
    margin: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    position: 'relative',
  },
  plantImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  placeholderImage: {
    width: 200,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  photoButton: {
    flex: 1,
  },
  formCard: {
    margin: 16,
    marginTop: 0,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});