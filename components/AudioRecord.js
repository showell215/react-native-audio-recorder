import React, { useState, useRef } from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import { Audio } from "expo-av";
// import { Ionicons } from "@expo/vector-icons";
import { Fontisto } from "@expo/vector-icons";
import {
  getInfoAsync as fsGetInfoAsync,
  documentDirectory,
  cacheDirectory,
  readDirectoryAsync as fsReadDirectoryAsync,
  makeDirectoryAsync,
  copyAsync,
} from "expo-file-system";
import sharedStyles from "../styles/shared";
import { DIR_RECORDINGS } from "react-native-config";
//Audio.getPermissionsAsync() /

export default function RecordAudio({ navigation }) {
  const currentRecording = useRef(null);
  const currentSound = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const onRecordPressed = () => {
    setIsLoading(true);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    if (currentSound.current !== null) {
      await currentSound.current.unloadAsync();
      currentSound.current.setOnPlaybackStatusUpdate(null);
      currentSound.current = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });

    if (currentRecording.current !== null) {
      currentRecording.current.setOnRecordingStatusUpdate(null);
      currentRecording.current = null;
    }

    const recording = new Audio.Recording();

    try {
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      currentRecording.current = recording;
      recording.setOnRecordingStatusUpdate(updateScreenForRecordingStatus);

      await recording.startAsync();
      setIsLoading(false);
      setIsRecording(true);
      // You are now recording!
    } catch (error) {
      // An error occurred!
      console.error(error);
    }
  };

  const stopRecording = async () => {
    setIsLoading(true);
    setIsRecording(false);
    try {
      await currentRecording.current.stopAndUnloadAsync();
    } catch (error) {
      // Do nothing -- we are already unloaded.
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    const {
      sound,
      status,
    } = await currentRecording.current.createNewLoadedSoundAsync(
      {},
      updateScreenForSoundStatus
    );
    currentSound.current = sound;
    setIsLoading(false);
    setIsPlaybackAllowed(true);
  };

  const saveRecordingToDisk = async () => {
    const fileInfo = await fsGetInfoAsync(currentRecording.current.getURI());

    try {
      await makeDirectoryAsync(documentDirectory + "my-recordings", {
        intermediates: true,
      });
      // save in persistent storage
      await copyAsync({
        from: fileInfo.uri,
        to: `${documentDirectory}/my-recordings/recording-${Date.now()}.caf`,
      });
    } catch (err) {
      console.error(err);
    }
  };
  const updateScreenForSoundStatus = (status) => {
    if (status.isPlaying) {
      setIsPlaying(true);
      setPlaybackDuration(status.positionMillis);
    } else {
      setIsPlaying(false);

      if (status.didJustFinish) {
        // seek back to 0
        currentSound.current.setPositionAsync(0);
      }
    }
  };

  const updateScreenForRecordingStatus = (status) => {
    if (status.canRecord) {
      setIsRecording(status.isRecording);
      setRecordingDuration(status.durationMillis);
    } else if (status.isDoneRecording) {
      setIsRecording(false);
      setRecordingDuration(status.durationMillis);
      if (!isLoading) {
        stopRecording();
      }
    }
  };

  const onPlayPausePressed = () => {
    if (currentSound.current != null) {
      if (isPlaying) {
        currentSound.current.pauseAsync();
      } else {
        currentSound.current.playAsync();
      }
    }
  };

  const padWithZero = (number) => {
    const string = number.toString();
    if (number < 10) {
      return "0" + string;
    }
    return string;
  };

  const getFormattedTimeFromMillis = (millis) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    return padWithZero(minutes) + ":" + padWithZero(seconds);
  };

  return (
    <View style={{ ...sharedStyles.container, opacity: isLoading ? 0.2 : 1.0 }}>
      <View style={{ ...styles.row, paddingBottom: 20 }}>
        {isRecording && (
          <>
            <Fontisto
              name={"stop"}
              onPress={onRecordPressed}
              size={24}
              color="red"
              accessibilityLabel="Stop record audio button"
            />
            <Text>
              Duration: {getFormattedTimeFromMillis(recordingDuration)}
            </Text>
          </>
        )}
        {!isRecording && (
          <>
            <Fontisto
              style={{ marginRight: 15 }}
              name={"record"}
              onPress={onRecordPressed}
              size={24}
              color="red"
              accessibilityLabel="Record audio button"
            />
            <Text>Record some audio</Text>
          </>
        )}
      </View>
      {isPlaybackAllowed && !isLoading && currentSound.current && (
        <>
          <View style={{ ...styles.row }}>
            <Fontisto
              style={{ marginRight: 15 }}
              name={isPlaying ? "pause" : "play"}
              onPress={onPlayPausePressed}
              size={24}
              color="black"
              accessibilityLabel="Playback recorded audio button"
            />
            <Text>Play back your audio</Text>
          </View>
          <View style={styles.row}>
            <Button
              onPress={saveRecordingToDisk}
              title="Save recording"
            ></Button>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
});
