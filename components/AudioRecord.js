import React, { useState, useRef } from "react";
import { Text, View, Button } from "react-native";
import { Audio } from "expo-av";
import { getInfoAsync as fsGetInfoAsync } from "expo-file-system";

//Audio.getPermissionsAsync() /

export default function App() {
  const currentRecording = useRef(null);
  const currentSound = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackAllowed, setIsPlaybackAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

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
    const info = await fsGetInfoAsync(currentRecording.current.getURI());
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
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
      this._updateScreenForSoundStatus
    );
    currentSound.current = sound;
    setIsLoading(false);
    setIsPlaybackAllowed(true);
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
    <View style={{ opacity: isLoading ? 0.2 : 1.0 }}>
      {!isRecording && <Text>Record some audio</Text>}
      {isRecording && (
        <>
          <Text>Recording!</Text>
          <Text>Duration: {getFormattedTimeFromMillis(recordingDuration)}</Text>
        </>
      )}
      <Button
        onPress={onRecordPressed}
        title="Record audio"
        color="#841584"
        accessibilityLabel="Record audio button"
      />
      <Button
        disabled={!isPlaybackAllowed || isLoading || !currentSound.current}
        onPress={onPlayPausePressed}
        title="Playback recorded audio"
        color="#841584"
        accessibilityLabel="Playback recordedaudio button"
      />
    </View>
  );
}
