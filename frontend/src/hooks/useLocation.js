import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export const useLocation = () => {
    const { getCurrentLocation, updateLocation } = useAuth();
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const getLocation = async () => {
        setIsGettingLocation(true);
        try {
            const location = await getCurrentLocation();
            return location;
        } catch (error) {
            console.error('Error getting location:', error);
            throw error;
        } finally {
            setIsGettingLocation(false);
        }
    };

    const updateCurrentLocation = async () => {
        setIsGettingLocation(true);
        try {
            const location = await getCurrentLocation();
            toast.success('Location updated successfully');
            return location;
        } catch (error) {
            console.error('Error updating location:', error);
            toast.error('Failed to update location');
            throw error;
        } finally {
            setIsGettingLocation(false);
        }
    };

    return {
        getLocation,
        updateCurrentLocation,
        isGettingLocation
    };
};

export default useLocation;