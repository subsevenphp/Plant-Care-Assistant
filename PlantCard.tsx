import React, { useState } from 'react';
import { PlantResponse } from '../types/plant.types';

// Props interface for the PlantCard component
interface PlantCardProps {
  plant: PlantResponse;
  onWaterPlant?: (plantId: string) => void;
  onEditPlant?: (plantId: string) => void;
  onViewDetails?: (plantId: string) => void;
  className?: string;
}

// Helper function to determine health status styling
const getHealthStatusStyles = (healthStatus: string) => {
  switch (healthStatus) {
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Helper function to format date
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'Never';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to calculate days until next watering
const getDaysUntilWatering = (nextWateringDue: Date | string | null | undefined): string => {
  if (!nextWateringDue) return 'Not scheduled';
  
  const dueDate = typeof nextWateringDue === 'string' ? new Date(nextWateringDue) : nextWateringDue;
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `Due in ${diffDays} days`;
  }
};

const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onWaterPlant,
  onEditPlant,
  onViewDetails,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle water button click
  const handleWaterClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (onWaterPlant && !isLoading) {
      setIsLoading(true);
      try {
        await onWaterPlant(plant.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle card click
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(plant.id);
    }
  };

  // Determine if plant needs watering
  const needsWatering = plant.nextWateringDue && new Date(plant.nextWateringDue) <= new Date();
  const wateringStatus = getDaysUntilWatering(plant.nextWateringDue);

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 
        border border-gray-200 overflow-hidden cursor-pointer group
        ${needsWatering ? 'ring-2 ring-blue-200 border-blue-300' : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Plant Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {plant.imageUrl && !imageError ? (
          <img
            src={plant.imageUrl}
            alt={`${plant.name} - ${plant.species}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <svg
              className="w-16 h-16 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13L13.5 7.5C13.1 6.8 12.6 6.3 12 6.1V4C12 1.8 10.2 0 8 0S4 1.8 4 4V6.1C3.4 6.3 2.9 6.8 2.5 7.5L1 13L7 7V9C7 10.1 7.9 11 9 11S11 10.1 11 9Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        
        {/* Health Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`
              px-2 py-1 text-xs font-medium rounded-full border
              ${getHealthStatusStyles(plant.healthStatus)}
            `}
          >
            {plant.healthStatus.charAt(0).toUpperCase() + plant.healthStatus.slice(1)}
          </span>
        </div>

        {/* Watering Status Indicator */}
        {needsWatering && (
          <div className="absolute top-3 left-3">
            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.348.895-5.9 2.5L2.5 6.1c-.4.4-.4 1 0 1.4s1 .4 1.4 0L5.5 6c1.2-1.2 2.8-1.9 4.5-1.9s3.3.7 4.5 1.9l1.6 1.5c.4.4 1 .4 1.4 0s.4-1 0-1.4L15.9 4.5C14.348 2.895 12.236 2 10 2zM7 12a3 3 0 106 0 3 3 0 00-6 0z" clipRule="evenodd" />
              </svg>
              Water Due
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Plant Name and Species */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {plant.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            {plant.species || 'Unknown species'}
          </p>
        </div>

        {/* Plant Details */}
        <div className="space-y-2 mb-4">
          {/* Watering Information */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Last watered:</span>
            <span className="text-gray-900 font-medium">
              {formatDate(plant.lastWatered)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Next watering:</span>
            <span className={`font-medium ${needsWatering ? 'text-blue-600' : 'text-gray-900'}`}>
              {wateringStatus}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Watering interval:</span>
            <span className="text-gray-900 font-medium">
              Every {plant.wateringInterval} day{plant.wateringInterval !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Location */}
          {plant.location && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Location:</span>
              <span className="text-gray-900 font-medium">{plant.location}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleWaterClick}
            disabled={isLoading}
            className={`
              flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
              ${needsWatering 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
            `}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Watering...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2c-2.236 0-4.348.895-5.9 2.5L2.5 6.1c-.4.4-.4 1 0 1.4s1 .4 1.4 0L5.5 6c1.2-1.2 2.8-1.9 4.5-1.9s3.3.7 4.5 1.9l1.6 1.5c.4.4 1 .4 1.4 0s.4-1 0-1.4L15.9 4.5C14.348 2.895 12.236 2 10 2zM7 12a3 3 0 106 0 3 3 0 00-6 0z" clipRule="evenodd" />
                </svg>
                Water Now
              </div>
            )}
          </button>

          {/* Edit Button */}
          {onEditPlant && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditPlant(plant.id);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantCard;