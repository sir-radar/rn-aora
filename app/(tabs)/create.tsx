import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomButton, FormField } from "../../components";
import { icons } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";
import { AppwriteFile, createVideoPost } from "../../lib/appwrite";

const copyToCacheIfNeeded = async (uri: string, filename?: string): Promise<string> => {
  if (!uri.startsWith("content://")) return uri;

  const cacheDir =
    (FileSystem as any).documentDirectory ||
    (FileSystem as any).cacheDirectory ||
    (FileSystem as any).temporaryDirectory ||
    "";

  const dest = `${cacheDir}${filename || `video-${Date.now()}.mp4`}`;

  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (err) {
    console.warn("Failed to copy content URI to cache:", err);
    return uri;
  }
};

const Create: React.FC = () => {
  const { user } = useGlobalContext();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    video: AppwriteFile | null;
    thumbnail: AppwriteFile | null;
    prompt: string;
  }>({
    title: "",
    video: null,
    thumbnail: null,
    prompt: "",
  });

  const openPicker = async (selectType: "image" | "video") => {
    try {
      // ask permission for media library
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow access to your photos/media.");
        return;
      }

      // Use ImagePicker for both images & videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          selectType === "image"
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: selectType === "image", // allow cropping for images
        quality: selectType === "image" ? 0.9 : 0.8,
      });

      // result.canceled is true if the user cancelled
      if (result.canceled) return;

      // result.assets is an array — use the first asset
      const asset = result.assets?.[0];
      if (!asset || !asset.uri) {
        Alert.alert("Picker error", "No asset returned from picker.");
        return;
      }

      if (selectType === "image") {
        setForm((prev) => ({
          ...prev,
          thumbnail: {
            uri: asset.uri,
            name: asset.fileName || `thumbnail-${Date.now()}.jpg`,
            type: asset.mimeType || "image/jpeg",
            size: (asset as any).fileSize ?? undefined,
          },
        }));
        console.log("Picked image URI:", asset.uri);
      } else {
        // video: ensure the uri is file:// by copying content:// if necessary
        const safeUri = await copyToCacheIfNeeded(asset.uri, asset?.fileName!);
        setForm((prev) => ({
          ...prev,
          video: {
            uri: safeUri,
            name: asset.fileName || `video-${Date.now()}.mp4`,
            type: asset.mimeType || "video/mp4",
            size: (asset as any).fileSize ?? undefined,
          },
        }));
      }
    } catch (err) {
      console.error("Picker error:", err);
      Alert.alert("Error", "Failed to open media picker.");
    }
  };

  const submit = async () => {
    if (!form.title || !form.video || !form.thumbnail || !form.prompt) {
      return Alert.alert("Missing fields", "Please fill in all required fields.");
    }

    setUploading(true);
    try {
      await createVideoPost({
        title: form.title,
        thumbnail: form.thumbnail,
        video: form.video,
        prompt: form.prompt,
        userId: user?.$id || "",
      });

      Alert.alert("Success", "Post uploaded successfully!");
      router.push("/home");
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setUploading(false);
      // setForm({ title: "", video: null, thumbnail: null, prompt: "" });
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">Upload Video</Text>

        <FormField
          title="Video Title"
          value={form.title}
          placeholder="Give your video a catchy title..."
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyles="mt-10"
        />

        {/* VIDEO PICKER */}
        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">Upload Video</Text>

          <TouchableOpacity onPress={() => openPicker("video")}>
            {form.video ? (
              <Video
                source={{ uri: form.video.uri }}
                style={{ width: "100%", height: 256, borderRadius: 16 }}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={false}
              />
            ) : (
              <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                  <Image source={icons.upload} resizeMode="contain" className="w-1/2 h-1/2" />
                </View>
                <Text className="text-sm text-gray-100 mt-2">Select a video</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* IMAGE PICKER */}
        <View className="mt-7 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">Thumbnail Image</Text>

          <TouchableOpacity onPress={() => openPicker("image")}>
            {form.thumbnail ? (
              <Image
                source={{ uri: form.thumbnail.uri }}
                resizeMode="cover"
                style={{ width: "100%", height: 256, borderRadius: 16 }}
              />
            ) : (
              <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex justify-center items-center flex-row space-x-2">
                <Image source={icons.upload} resizeMode="contain" className="w-5 h-5" />
                <Text className="text-sm text-gray-100 font-pmedium">Choose a file</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FormField
          title="AI Prompt"
          value={form.prompt}
          placeholder="The AI prompt of your video..."
          handleChangeText={(e) => setForm({ ...form, prompt: e })}
          otherStyles="mt-7"
        />

        <CustomButton
          title="Submit & Publish"
          handlePress={submit}
          containerStyles="mt-7"
          isLoading={uploading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Create;
