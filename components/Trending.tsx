import { ResizeMode, Video } from "expo-av";
import React, { useRef, useState } from "react";
import { FlatList, Image, ImageBackground, TouchableOpacity, View, ViewToken } from "react-native";
import * as Animatable from "react-native-animatable";
import { icons } from "../constants";

const zoomIn = {
  0: { scale: 0.9 },
  1: { scale: 1 },
} as Animatable.CustomAnimation<
  import("react-native").TextStyle &
    import("react-native").ViewStyle &
    import("react-native").ImageStyle
>;

const zoomOut = {
  0: { scale: 1 },
  1: { scale: 0.9 },
} as Animatable.CustomAnimation<
  import("react-native").TextStyle &
    import("react-native").ViewStyle &
    import("react-native").ImageStyle
>;

type Post = {
  id: string;
  video: string;
  thumbnail: string;
  [key: string]: any;
};

type TrendingItemProps = {
  activeItem: string;
  item: Post;
};

const TrendingItem = ({ activeItem, item }: TrendingItemProps) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef<Video>(null);

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.id ? zoomIn : zoomOut}
      duration={500}
      useNativeDriver
    >
      {play ? (
        <View
          className="w-52 h-72 rounded-[33px] mt-3 overflow-hidden bg-black"
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Video
            key={item.thumbnail}
            ref={videoRef}
            source={{ uri: item.video }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 33,
            }}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            onLoadStart={() => console.log("Loading video:", item.$id)}
            onError={(err) => console.error("Video error:", err)}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setPlay(false);
              }
            }}
          />
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setPlay(true)}
          className="relative flex justify-center items-center"
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-52 h-72 rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode="cover"
          />
          <Image source={icons.play} className="w-12 h-12 absolute" resizeMode="contain" />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

type TrendingProps = {
  posts: Post[];
};

const Trending = ({ posts }: TrendingProps) => {
  const [activeItem, setActiveItem] = useState(posts[0]?.id ?? "");

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0]?.item?.id) {
      setActiveItem(viewableItems[0].item.id);
    }
  }).current;

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.thumbnail}
      renderItem={({ item }) => <TrendingItem activeItem={activeItem} item={item} />}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: 170, y: 0 }}
    />
  );
};

export default Trending;
