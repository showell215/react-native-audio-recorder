import React, { useState, useEffect } from "react";
import { SwipeListView } from "react-native-swipe-list-view";
import {
  Text,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableHighlight,
} from "react-native";
import { Audio } from "expo-av";
import { Fontisto } from "@expo/vector-icons";
import sharedStyles from "../styles/shared";
import {
  documentDirectory,
  readDirectoryAsync as fsReadDirectoryAsync,
  deleteAsync,
} from "expo-file-system";

export default function Recordings() {
  const [isLoading, setLoading] = useState(true);
  const [recordingList, setRecordingList] = useState([]);
  const [rowAnimatedValues, setRowAnimatedValues] = useState({});
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);

  const soundObject = new Audio.Sound();

  useEffect(() => {
    initialize();
  }, []);

  const getListOfRecordings = async () => {
    const recordings = await fsReadDirectoryAsync(
      documentDirectory + "my-recordings"
    );

    const recordingMap = recordings.map((recording) => ({
      key: recording,
      text: recording,
      filePath: documentDirectory + "my-recordings/" + recording,
    }));
    setRecordingList(recordingMap);
    setRowAnimatedValues(
      recordingMap.reduce((aninmatedValuesMap, current) => {
        aninmatedValuesMap[current.key] = new Animated.Value(1);

        return aninmatedValuesMap;
      }, {})
    );
  };

  const initialize = async () => {
    await getListOfRecordings();
    setLoading(false);
  };

  const playRecording = async (recordingFileName) => {
    console.log("play recording pressed", recordingFileName);
    try {
      await soundObject.unloadAsync();
      await soundObject.loadAsync({
        uri: recordingFileName,
      });
      await soundObject.playAsync();
      // Your sound is playing!
    } catch (error) {
      console.error(error);
      // An error occurred!
    }
  };

  const onSwipeValueChange = (swipeData) => {
    const { key, value } = swipeData;
    if (value < -Dimensions.get("window").width && !isAnimationRunning) {
      setIsAnimationRunning(true);
      Animated.timing(rowAnimatedValues[key], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        const newData = [...recordingList];
        const prevIndex = recordingList.findIndex((item) => item.key === key);
        newData.splice(prevIndex, 1);
        deleteRecording(recordingList[prevIndex]);
        setRecordingList(newData);
        setIsAnimationRunning(false);
      });
    }
  };

  const deleteRecording = async (item) => {
    try {
      await deleteAsync(item.filePath);
      console.log("recording deleted", item.text);
    } catch (err) {
      console.error("Unexpected error deleting recording", item.text, err);
      // put it back in the list since delete wasn't successful
      setRecordingList([...recordingList, item]);
    }
  };

  const openPlaybackControls = (itemData) => {
    console.log("y u touch?", itemData);
    playRecording(itemData.item.filePath);
  };

  const renderItem = (data) => {
    return (
      <Animated.View
        style={[
          styles.rowFrontContainer,
          {
            height: rowAnimatedValues[data.item.key].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50],
            }),
          },
        ]}
      >
        <TouchableHighlight
          onPress={() => openPlaybackControls(data)}
          style={styles.rowFront}
          underlayColor={"#AAA"}
        >
          <View>
            <Text>{data.item.text}</Text>
          </View>
        </TouchableHighlight>
      </Animated.View>
    );
  };

  const renderHiddenItem = () => (
    <View style={styles.rowBack}>
      <View style={[styles.backRightBtn, styles.backRightBtnRight]}>
        <Text style={styles.backTextWhite}>Swipe Left to Delete</Text>
      </View>
    </View>
  );

  return (
    <View style={{ ...sharedStyles.container }}>
      <Text>Play back your recordings</Text>
      {isLoading && <Text>Loading you recordings...</Text>}
      {!isLoading && (
        <SwipeListView
          style={styles.swipeListContainer}
          disableRightSwipe
          data={recordingList}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-Dimensions.get("window").width}
          onSwipeValueChange={onSwipeValueChange}
          useNativeDriver={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  swipeListContainer: {
    width: "100%",
  },
  backTextWhite: {
    color: "#FFF",
  },
  rowFront: {
    alignItems: "center",
    backgroundColor: "#CCC",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    justifyContent: "center",
    height: 50,
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "red",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 15,
  },
  backRightBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: "red",
    right: 0,
  },
});
