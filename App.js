import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";

import AudioRecord from "./components/AudioRecord";

export default function App() {
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
      console.log("got permissions", response);
    } catch (err) {
      console.error(err);
    }

    setRecordingPermissions(response.status === "granted");
  };

  return !isError ? (
    <View style={{ ...styles.container, opacity: isLoading ? 0.2 : 1.0 }}>
      {isRecordingPermitted ? (
        <AudioRecord />
      ) : (
        <Text>
          You must enable audio recording permissions in order to use this app.
        </Text>
      )}
    </View>
  ) : (
    <View>
      <Text>ERROR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
