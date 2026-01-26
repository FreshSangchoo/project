import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import CenterHeader from '@/components/common/header/CenterHeader';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconX from '@/assets/icons/IconX.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { semanticColor } from '@/styles/semantic-color';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import ToolBar from '@/components/common/button/ToolBar';

import { AvoidSoftInput } from 'react-native-avoid-softinput';

interface AuthLayoutProps {
  headerTitle: string;
  buttonText: string;
  buttonDisabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  headerRightChildsOnPress?: () => void;
}

const isAndroid = Platform.OS === 'android';

const AuthLayout = ({
  headerTitle,
  buttonText,
  buttonDisabled,
  onPress,
  children,
  headerRightChildsOnPress,
}: AuthLayoutProps) => {
  const navigation = useAuthNavigation();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const [sticky, setSticky] = useState(false);

  const dismissKb = () => {
    Keyboard.dismiss();
  };

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange((e: any) => {
      setHeight(e.softInputHeight);
      setSticky(true);
      if (e.softInputHeight === 0) setSticky(false);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView
      edges={isAndroid ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
      style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={semanticColor.surface.white} />

      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={dismissKb} accessible={false}>
          <View style={[{ flex: 1 }, isAndroid && height > 0 ? { marginBottom: -height } : null]}>
            <CenterHeader
              title={headerTitle}
              leftChilds={{
                icon: (
                  <IconChevronLeft
                    width={28}
                    height={28}
                    stroke={semanticColor.icon.primary}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                ),
                onPress: () => {
                  dismissKb();
                  navigation.goBack();
                },
              }}
              rightChilds={[
                {
                  icon: (
                    <IconX
                      width={28}
                      height={28}
                      stroke={semanticColor.icon.primary}
                      strokeWidth={semanticNumber.stroke.bold}
                    />
                  ),
                  onPress: () => {
                    dismissKb();
                    headerRightChildsOnPress
                      ? headerRightChildsOnPress
                      : navigation.reset({ routes: [{ name: 'Welcome' }] });
                  },
                },
              ]}
            />

            {children}
          </View>
        </TouchableWithoutFeedback>

        <View
          style={{
            backgroundColor: semanticColor.surface.white,
            paddingBottom: isAndroid ? insets.bottom + height! : height! - insets.bottom,
          }}>
          <ToolBar children={buttonText} onPress={onPress} disabled={buttonDisabled} isSticky={sticky} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
});

export default AuthLayout;
