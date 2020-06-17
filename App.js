import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AudioRecord from "./components/AudioRecord";
import Recordings from "./components/Recordings";
import HomeScreen from "./components/Home";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RecordAudio" component={AudioRecord} />
        <Stack.Screen name="PlaybackAudio" component={Recordings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
