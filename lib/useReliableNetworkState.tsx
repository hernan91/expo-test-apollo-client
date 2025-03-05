import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useReliableNetworkState() {
  const [state, setState] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setState(state);
    });

    return () => unsubscribe();
  }, []);

  return state;
}