import 'react-native-get-random-values'
import { useEffect } from 'react';
import { AuthProvider } from './src/context/auth';
import { Navigation } from './src/navigations';
import { testSupabaseConnection } from './src/utils/testSupabase';
import DatabaseConnection from './src/core/infra/sqlite/connection';
import { SyncService } from './src/core/services/SyncService';

export default function App() {
  useEffect(() => {
    async function initializeApp() {
      await testSupabaseConnection();
      await DatabaseConnection.getConnection();
      SyncService.getInstance();
    }
    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}