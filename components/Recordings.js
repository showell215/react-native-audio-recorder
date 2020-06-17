import React, { useState, useEffect } from "react";

import { Text, View, StyleSheet, Button } from "react-native";
import { Audio } from "expo-av";
// import { Ionicons } from "@expo/vector-icons";
import { Fontisto } from "@expo/vector-icons";
import sharedStyles from "../styles/shared";
import {
  getInfoAsync as fsGetInfoAsync,
  documentDirectory,
  cacheDirectory,
  moveAsync as fsMoveAsync,
  readDirectoryAsync as fsReadDirectoryAsync,
  makeDirectoryAsync,
  copyAsync,
} from "expo-file-system";
import { DIR_RECORDINGS } from "react-native-config";
//Audio.getPermissionsAsync() /

export default function Recordings() {
  const [isLoading, setLoading] = useState(true);
  const [recordingList, setRecordingList] = useState([]);

  const soundObject = new Audio.Sound();
  // try {
  //   await soundObject.loadAsync(require('./assets/sounds/hello.mp3'));
  //   await soundObject.playAsync();
  //   // Your sound is playing!
  // } catch (error) {
  //   // An error occurred!
  // }

  useEffect(() => {
    getListOfRecordings().then(setLoading(false));
  }, []);

  const getListOfRecordings = async () => {
    const recordings = await fsReadDirectoryAsync(
      documentDirectory + "my-recordings"
    );
    setRecordingList(recordings);
  };

  const playRecording = async (recordingFileName) => {
    console.log("play recording pressed", recordingFileName);
    try {
      await soundObject.unloadAsync();
      await soundObject.loadAsync({
        uri: documentDirectory + "my-recordings/" + recordingFileName,
      });
      await soundObject.playAsync();
      // Your sound is playing!
    } catch (error) {
      console.error(error);
      // An error occurred!
    }
  };

  return (
    <View style={{ ...sharedStyles.container }}>
      <Text>Play back your recordings</Text>
      {isLoading && <Text>Loading you recordings...</Text>}
      {!isLoading && (
        <View>
          {recordingList.map((recordingName, idx) => (
            <Button
              key={idx}
              title={recordingName}
              onPress={() => playRecording(recordingName)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
