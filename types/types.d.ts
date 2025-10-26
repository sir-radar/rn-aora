import { TouchableOpacityProps } from "react-native";

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  handlePress: () => void;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
}

declare interface InputFieldProps extends TextInputProps {
  title: string;
  value: string;
  handleChangeText: (e: string) => void;
  otherStyles?: string;
}
