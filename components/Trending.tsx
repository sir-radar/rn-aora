import { ResizeMode, Video } from "expo-av";
import { useState } from "react";
import { FlatList, Image, ImageBackground, TouchableOpacity } from "react-native";
import * as Animatable from "react-native-animatable";

import { icons } from "../constants";

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
} as Animatable.CustomAnimation<
  import("react-native").TextStyle &
    import("react-native").ViewStyle &
    import("react-native").ImageStyle
>;

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
} as Animatable.CustomAnimation<
  import("react-native").TextStyle &
    import("react-native").ViewStyle &
    import("react-native").ImageStyle
>;

type TrendingItemProps = {
  activeItem: string;
  item: {
    id: string;
    video: string;
    thumbnail: string;
  };
};

const TrendingItem = ({ activeItem, item }: TrendingItemProps) => {
  const [play, setPlay] = useState(false);

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <Video
          source={{ uri: item.video }}
          className="w-52 h-72 rounded-[33px] mt-3 bg-white/10"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (
              status.isLoaded &&
              typeof status.positionMillis === "number" &&
              typeof status.durationMillis === "number" &&
              status.positionMillis >= status.durationMillis
            ) {
              setPlay(false);
            }
          }}
        />
      ) : (
        <TouchableOpacity
          className="relative flex justify-center items-center"
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
        >
          <ImageBackground
            source={{
              uri: item.thumbnail,
            }}
            className="w-52 h-72 rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode="cover"
          />

          <Image source={icons.play} className="w-12 h-12 absolute" resizeMode="contain" />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

type Post = {
  id: string;
  video: string;
  thumbnail: string;
  [key: string]: any;
};

type TrendingProps = {
  posts: Post[];
};

const Trending = ({ posts }: TrendingProps) => {
  const [activeItem, setActiveItem] = useState(posts[0]?.id ?? "");

  const viewableItemsChanged = ({ viewableItems }: { viewableItems: { key: string }[] }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TrendingItem activeItem={activeItem} item={item} />}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170, y: 0 }}
    />
  );
};

export default Trending;
