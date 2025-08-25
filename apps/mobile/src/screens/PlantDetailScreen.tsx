import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'PlantDetail'>;

// Mock plant detail data - this will be replaced with actual API data
const mockPlantDetail = {
  id: '1',
  name: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  notes: 'Beautiful climbing plant with split leaves. Loves bright, indirect light.',
  imageUrl: null, // No image for now
  lastWatered: '2024-01-15',
  nextWatering: '2024-01-22',
  wateringFrequency: 7,
  needsWater: false,
  location: 'Living Room',
  acquisitionDate: '2023-06-15',
  healthStatus: 'healthy',
};

export default function PlantDetailScreen({ navigation, route }: Props) {
  const { plantId } = route.params;
  const [plant, setPlant] = useState(mockPlantDetail);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPlantDetails();
  }, [plantId]);

  const loadPlantDetails = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Loading plant details for:', plantId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For now, use mock data
      setPlant(mockPlantDetail);
    } catch (error) {
      console.error('Error loading plant details:', error);
      Alert.alert('Error', 'Failed to load plant details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaterPlant = async () => {
    try {
      // TODO: Replace with actual API call
      console.log('Watering plant:', plantId);
      
      Alert.alert('Success', 'Plant watered successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Update local state
            setPlant(prev => ({
              ...prev,
              lastWatered: new Date().toISOString().split('T')[0],
              needsWater: false,
            }));
          },
        },
      ]);
    } catch (error) {
      console.error('Error watering plant:', error);
      Alert.alert('Error', 'Failed to record watering. Please try again.');
    }
  };

  const handleEditPlant = () => {
    // TODO: Navigate to edit plant screen
    Alert.alert('Feature Coming Soon', 'Plant editing will be available soon!');
  };

  const handleDeletePlant = () => {
    Alert.alert(
      'Delete Plant',
      'Are you sure you want to delete this plant? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              console.log('Deleting plant:', plantId);
              
              Alert.alert('Success', 'Plant deleted successfully!', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting plant:', error);
              Alert.alert('Error', 'Failed to delete plant. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={handleEditPlant}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plant Image */}
        <View style={styles.imageContainer}>
          {plant.imageUrl ? (
            <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderImageText}>🌱</Text>
              <Text style={styles.placeholderText}>No photo yet</Text>
            </View>
          )}
        </View>

        {/* Plant Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={styles.plantSpecies}>{plant.species}</Text>
          
          {plant.notes && (
            <Text style={styles.plantNotes}>{plant.notes}</Text>
          )}
        </View>

        {/* Care Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Care Status</Text>
          <View style={[
            styles.statusCard,
            plant.needsWater && styles.statusCardWarning
          ]}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Watered:</Text>
              <Text style={styles.statusValue}>{plant.lastWatered}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Next Watering:</Text>
              <Text style={[
                styles.statusValue,
                plant.needsWater && styles.statusValueWarning
              ]}>
                {plant.needsWater ? 'Overdue!' : plant.nextWatering}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Frequency:</Text>
              <Text style={styles.statusValue}>Every {plant.wateringFrequency} days</Text>
            </View>
          </View>
        </View>

        {/* Plant Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            {plant.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{plant.location}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Health Status:</Text>
              <Text style={[
                styles.detailValue,
                styles.healthStatus,
                plant.healthStatus === 'healthy' && styles.healthStatusHealthy
              ]}>
                {plant.healthStatus.charAt(0).toUpperCase() + plant.healthStatus.slice(1)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Added:</Text>
              <Text style={styles.detailValue}>{plant.acquisitionDate}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.waterButton,
              plant.needsWater && styles.waterButtonUrgent
            ]}
            onPress={handleWaterPlant}
          >
            <Text style={styles.waterButtonText}>
              {plant.needsWater ? '💧 Water Now' : '💧 Record Watering'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePlant}>
            <Text style={styles.deleteButtonText}>Delete Plant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  editButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderImageText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 16,
  },
  plantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  plantSpecies: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  plantNotes: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  statusContainer: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statusCardWarning: {
    borderLeftColor: '#F59E0B',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusValueWarning: {
    color: '#F59E0B',
  },
  detailsContainer: {
    padding: 24,
    paddingTop: 0,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  healthStatus: {
    textTransform: 'capitalize',
  },
  healthStatusHealthy: {
    color: '#10B981',
  },
  actionsContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  waterButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  waterButtonUrgent: {
    backgroundColor: '#F59E0B',
  },
  waterButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});