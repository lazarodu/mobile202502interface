import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ComponentButtonInterface } from "../../components";
import { VinylRecord } from "../../core/domain/entities/VinylRecord";
import { VinylRecordTypes } from "../../navigations/VinylRecordStackNavigation";
import { makeVinylRecordUseCases } from "../../core/factories/makeVinylRecordUseCases";
import { Entypo } from "@expo/vector-icons";
import { colors } from "../../styles/colors";


export function VinylRecordDetailsScreen({ navigation }: VinylRecordTypes) {
    const route = useRoute()
    const { record } = route.params as { record: VinylRecord };
    const vinylRecordUseCases = makeVinylRecordUseCases();

    async function handleDelete() {
        Alert.alert("Delete", "Are you sure you want to delete this record?", [
            {
                text: "Cancel",
                style: "cancel"
            },
            {
                text: "Delete",
                onPress: async () => {
                    try {
                        await vinylRecordUseCases.deleteVinylRecord.execute({ id: record.id });
                        const segments = record.photo.url.split('/');
                        console.log(segments.pop() || '')
                        await vinylRecordUseCases.deleteFile.execute({bucket: 'photos', path: segments.pop() || ''})
                        Alert.alert("Success", "Record deleted successfully");
                        navigation.navigate("ListVinylRecords");
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete record");
                    }
                }
            }
        ])
    }

    return (
        <View style={styles.container}>
            <Image source={{ uri: record.photo.url }} style={styles.imagePreview} />
            <Text>Vinyl Record Details</Text>
            <Text>Band: {record.band.value}</Text>
            <Text>Album: {record.album.value}</Text>
            <Text>Year: {record.year}</Text>
            <Text>Number of Tracks: {record.numberOfTracks}</Text>
            <View style={styles.contentRow}>
                <ComponentButtonInterface type="secondary" title="Edit"
                    onPress={() => navigation.navigate("EditVinylRecord", { record })}
                >
                    <ComponentButtonInterface.Icon>
                        <Entypo name="pencil" size={24} color={colors.white} />
                    </ComponentButtonInterface.Icon>
                </ComponentButtonInterface>
                <ComponentButtonInterface type="danger" title="Delete"
                    onPress={handleDelete}
                >
                    <ComponentButtonInterface.Icon>
                        <Entypo name="trash" size={24} color={colors.white} />
                    </ComponentButtonInterface.Icon>
                </ComponentButtonInterface>
            </View>
            <ComponentButtonInterface type="primary" title="Voltar"
                onPress={() => navigation.navigate("ListVinylRecords")}
            />
        </View>
    )
}
export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    contentRow: {
        flexDirection: "row"
    },
    imagePreview: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginVertical: 10,
        borderRadius: 10,
    },
})