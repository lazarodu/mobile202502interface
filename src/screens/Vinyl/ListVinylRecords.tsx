import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Image
} from "react-native";
import { ComponentButtonInterface, ComponentLoading } from "../../components";
import { VinylRecordTypes } from "../../navigations/VinylRecordStackNavigation";
import { colors } from "../../styles/colors";
import { makeVinylRecordUseCases } from "../../core/factories/makeVinylRecordUseCases";
import { useEffect, useState } from "react";
import { VinylRecord } from "../../core/domain/entities/VinylRecord";
import { useIsFocused } from "@react-navigation/native";

export function ListVinylRecordsScreen({ navigation }: VinylRecordTypes) {
  const [records, setRecords] = useState<VinylRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vinylRecordUseCases = makeVinylRecordUseCases();
  const isFocused = useIsFocused();

  async function fetchRecords() {
    setLoading(true);
    setError(null);
    try {
      const allRecords = await vinylRecordUseCases.findAllVinylRecords.execute();
      setRecords(allRecords);
    } catch (err) {
      setError("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isFocused) {
      fetchRecords();
    }
  }, [isFocused]);

  const renderItem = ({ item }: { item: VinylRecord }) => {
    return(
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>
        {item.band.value} - {item.album.value}
      </Text>
      <ComponentButtonInterface title="detalhes" type="primary" onPress={() => navigation.navigate("VinylRecordDetails", { record: item })} />
    </View>
  );}

  return (
    <View style={styles.container}>
      <ComponentButtonInterface title="Register New Vinyl Record" type="secondary" onPress={() => navigation.navigate("RegisterVinylRecord")} />
      {loading ? (
        <ComponentLoading />
      ) : error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={<Text>Ver discos</Text>}
          ListEmptyComponent={<Text>Nenhum disco registrado.</Text>}
        />
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  itemContainer: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.black,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 20,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    marginTop: 50,
  },
});
