import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

// Mock plant data - this will be replaced with actual API data
const mockPlants = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    species: 'Monstera deliciosa',
    lastWatered: '2024-01-15',
    nextWatering: '2024-01-22',
    needsWater: false,
  },
  {
    id: '2',
    name: 'Snake Plant',
    species: 'Sansevieria trifasciata',
    lastWatered: '2024-01-10',
    nextWatering: '2024-01-17',
    needsWater: true,
  },
  {
    id: '3',
    name: 'Peace Lily',
    species: 'Spathiphyllum',
    lastWatered: '2024-01-14',
    nextWatering: '2024-01-19',
    needsWater: true,
  },
];

export default function HomeScreen({ navigation }: Props) {
  const [plants, setPlants] = useState(mockPlants);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Loading plants from API...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use mock data
      setPlants(mockPlants);
    } catch (error) {
      console.error('Error loading plants:', error);
      Alert.alert('Error', 'Failed to load plants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlants();
    setRefreshing(false);
  };

  const navigateToPlantDetail = (plantId: string) => {
    navigation.navigate('PlantDetail', { plantId });
  };

  const navigateToAddPlant = () => {
    navigation.navigate('AddPlant');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { useAuth } = await import('../store/authStore');
              const { authService } = await import('../services/authService');
              
              // Call backend logout
              await authService.logout();
              
              // Clear local auth state
              const { logout } = useAuth.getState();
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              // Still logout locally even if backend call fails
              const { useAuth } = await import('../store/authStore');
              const { logout } = useAuth.getState();
              await logout();
            }
          },
        },
      ]
    );
  };

  const renderPlantItem = ({ item }: { item: typeof mockPlants[0] }) => (
    <TouchableOpacity
      style={[styles.plantCard, item.needsWater && styles.plantCardNeedsWater]}
      onPress={() => navigateToPlantDetail(item.id)}
    >
      <View style={styles.plantCardContent}>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{item.name}</Text>
          <Text style={styles.plantSpecies}>{item.species}</Text>
          <Text style={styles.plantDetails}>
            Last watered: {item.lastWatered}
          </Text>
          <Text style={[
            styles.plantDetails,
            item.needsWater && styles.needsWaterText
          ]}>
            {item.needsWater ? 'Needs watering!' : `Next watering: ${item.nextWatering}`}
          </Text>
        </View>
        {item.needsWater && (
          <View style={styles.waterIndicator}>
            <Text style={styles.waterIndicatorText}>💧</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Plants Yet</Text>
      <Text style={styles.emptyStateMessage}>
        Add your first plant to start your plant care journey!
      </Text>
      <TouchableOpacity style={styles.addFirstPlantButton} onPress={navigateToAddPlant}>
        <Text style={styles.addFirstPlantButtonText}>Add Your First Plant</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Plants</Text>
          <Text style={styles.headerSubtitle}>
            {plants.length} {plants.length === 1 ? 'plant' : 'plants'} in your collection
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Plants List */}
      <FlatList
        data={plants}
        renderItem={renderPlantItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          plants.length === 0 && styles.listContainerEmpty
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Plant Button */}
      {plants.length > 0 && (
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddPlant}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  plantCardNeedsWater: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  plantCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  plantSpecies: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  plantDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  needsWaterText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  waterIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterIndicatorText: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstPlantButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstPlantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});