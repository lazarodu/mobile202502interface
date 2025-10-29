import React, { useEffect, useRef, useState } from 'react';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { Alert, Text, View } from 'react-native';
import { styles } from './styles'
import * as Location from "expo-location";
import { colors } from '../../styles/colors';
import {
  GooglePlaceData, GooglePlaceDetail,
  GooglePlacesAutocomplete
} from "react-native-google-places-autocomplete"
import MapViewDirections from 'react-native-maps-directions';

export function LocationMap() {
  const [location, setLocation] = useState<null | Location.LocationObject>(
    null
  );
  const [region, setRegion] = useState<Region>();
  const [marker, setMarker] = useState<Region[]>();
  const [errorMsg, setErrorMsg] = useState<null | string>(null);
  const [destination, setDestination] = useState<Region | null>({
    latitude: -21.5715146,
    longitude: -45.4520052,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004
  })
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    const handleLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync();
      if (location) {
        setLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        });
        setMarker([
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          },
        ]);
      }
    };
    handleLocation();
  }, []);

  async function handleDestination(data: GooglePlaceData, details: GooglePlaceDetail | null) {
    if (details) {
      setDestination({
        latitude: details?.geometry.location.lat,
        longitude: details?.geometry.location.lng,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004
      })
      if (marker) {
        setMarker([...marker, {
          latitude: details?.geometry.location.lat,
          longitude: details?.geometry.location.lng,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004
        }])
      }
    }
  }

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View style={styles.container}>
      {!region && <Text style={styles.paragraph}>{text}</Text>}
      {region && (
        <>
          {/* <GooglePlacesAutocomplete
            styles={{ container: styles.searchContainer, textInput: styles.searchInput }}
            placeholder="Para onde?"
            fetchDetails={true}
            GooglePlacesDetailsQuery={{ fields: "geometry" }}
            enablePoweredByContainer={false}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_PLACES,
              language: 'pt-BR'
            }}
            onFail={setErrorMsg}
            onPress={handleDestination}
          /> */}
          <MapView style={styles.map} region={region}
            showsUserLocation={true} ref={mapRef} onPress={(i) => setDestination({
              latitude: i.nativeEvent.coordinate.latitude,
              longitude: i.nativeEvent.coordinate.longitude,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004
            })}
          >
            {marker &&
              marker.map((item) => (
                <Marker key={item.latitude} coordinate={item} />
              ))}
            {/* <Polyline
              coordinates={[
                { latitude: -21.5777163, longitude: -45.446078 },
                { latitude: -21.573369, longitude: -45.448295 },
              ]}
              strokeColor={colors.black}
              strokeWidth={7}
            /> */}
            {destination && (
              <MapViewDirections
                origin={region}
                destination={destination}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_PLACES}
                strokeColor={colors.black}
                strokeWidth={7}
                lineDashPattern={[0]}
                onReady={(result) => {
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      top: 24,
                      bottom: 24,
                      left: 24,
                      right: 24
                    }
                  })
                }}
              />
            )}
          </MapView>
        </>
      )}
    </View>
  );
}
