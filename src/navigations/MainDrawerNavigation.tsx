import { createDrawerNavigator } from '@react-navigation/drawer';
import { MeuTabNavigation } from './MeuTabNavigation';
import { colors } from '../styles/colors';
import { VinylRecordStackNavigation } from './VinylRecordStackNavigation';
import { CameraTabNavigation } from './CameraTabNavigation';
import { LocationTabNavigation } from './LocationTabNavigation';
import { useNetwork } from '../hooks/useNetwork';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator({
    initialRouteName: 'Meu',
    screens: {
        Meu: MeuTabNavigation
    }
});

function NetworkIndicator() {
    const netInfo = useNetwork();
    if (netInfo === null || netInfo.isConnected) {
        return null;
    }
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <MaterialCommunityIcons name="wifi-off" size={16} color={colors.white} />
            <Text style={{ color: colors.white, marginLeft: 5 }}>Offline</Text>
        </View>
    );
}

export function MainDrawerNavigation() {
    return (
        <Drawer.Navigator screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
            drawerStyle: {
                backgroundColor: colors.primary,
            },
            drawerActiveTintColor: colors.white,
            drawerInactiveTintColor: colors.white,
            headerRight: () => <NetworkIndicator />,
        }}>
            <Drawer.Screen component={MeuTabNavigation} name='Meu' />
            <Drawer.Screen component={VinylRecordStackNavigation} name='Vinyl Records' />
            <Drawer.Screen component={CameraTabNavigation} name='Fotos' />
            <Drawer.Screen component={LocationTabNavigation} name='Localization' />
        </Drawer.Navigator>
    );
}
