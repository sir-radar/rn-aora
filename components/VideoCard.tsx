import { ResizeMode, Video } from "expo-av";
import { useRef, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { icons } from "../constants";

interface VideoCardProps {
  title: string;
  creator: string;
  avatar: string;
  thumbnail: string;
  video: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const VideoCard = ({ title, creator, avatar, thumbnail, video }: VideoCardProps) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef<Video>(null);

  return (
    <View className="flex flex-col items-center px-4 mb-14">
      {/* Header */}
      <View className="flex flex-row gap-3 items-start w-full">
        <View className="flex flex-row flex-1 items-center">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary p-0.5 overflow-hidden">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>
          <View className="flex justify-center flex-1 ml-3">
            <Text className="font-psemibold text-sm text-white" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-xs text-gray-100 font-pregular" numberOfLines={1}>
              {creator}
            </Text>
          </View>
        </View>

        <Image source={icons.menu} className="w-5 h-5 mt-2" resizeMode="contain" />
      </View>

      {/* Video */}
      <View
        style={{
          width: SCREEN_WIDTH - 32,
          aspectRatio: 16 / 9,
          borderRadius: 12,
          marginTop: 12,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        {play ? (
          <Video
            ref={videoRef}
            source={{ uri: video }}
            style={{ width: "100%", height: "100%" }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            onError={(err) => console.error("Video error:", err)}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) setPlay(false);
            }}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPlay(true)}
            style={{
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri: thumbnail }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
            <Image source={icons.play} style={{ width: 50, height: 50, position: "absolute" }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default VideoCard;
