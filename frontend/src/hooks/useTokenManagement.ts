import { useState, useCallback } from 'react';
import { requestForToken } from '../firebase';
import { sendTokenToServer } from '@api/push';

export function useTokenManagement() {
    const [token, setToken] = useState<string | null>(null);

    const saveToken = useCallback(async (username: string) => {
        try {
            const newToken = await requestForToken();
            if (newToken) {
                setToken(newToken);
                await sendTokenToServer(newToken, username);
                console.log('Push notification token saved successfully');
            } else {
                console.log('Failed to get push notification token');
            }
        } catch (error) {
            console.error('Error saving push notification token:', error);
        }
    }, []);

    return { token, saveToken };
}