import React, { useState, useEffect } from "react";
import { Text, View, Button } from "react-native";
import sharedStyles from "../styles/shared";
import { Audio } from "expo-av";

export default function HomeScreen({ navigation }) {
  const [isRecordingPermitted, setRecordingPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    askForPermissions()
      .then(() => setIsLoading(false))
      .catch(() => setIsError(true));
  }, []);

  const askForPermissions = async () => {
    let response = {};

    try {
      response = await Audio.requestPermissionsAsync();
      // console.log("got permissions", response);
    } catch (err) {
      console.error(err);
    }

    setRecordingPermissions(response.status === "granted");
  };

  return (
    <View
      style={{
        ...sharedStyles.container,
        opacity: isLoading ? 0.2 : 1.0,
      }}
    >
      <Text>Audio Recorder</Text>
      {isRecordingPermitted ? (
        <View>
          <Button
            title="Record a session"
            onPress={() => navigation.navigate("RecordAudio")}
          />
          <Button
            title="Play back a session"
            onPress={() => navigation.navigate("PlaybackAudio")}
          />
        </View>
      ) : (
        <Text>Recording permissions are required</Text>
      )}
    </View>
  );
}
