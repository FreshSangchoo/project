import { StyleSheet, TouchableOpacity, View } from 'react-native';
import HomeHeaderLogoSvg from '@assets/icons/HomeHeaderLogo.svg';
import SearchIcon from '@assets/icons/IconSearch.svg';
import BellIcon from '@assets/icons/IconBell.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';

interface HomeHeaderProps {
  onPressNotification?: () => void;
  onPressSearch?: () => void;
}

function HomeHeader({ onPressNotification, onPressSearch }: HomeHeaderProps) {
  return (
    <View style={styles.homeHeader}>
      <HomeHeaderLogoSvg style={styles.homeHeaderLogo} />
      <View style={styles.iconWrapper}>
        <TouchableOpacity style={styles.iconButtonWrapper} onPress={onPressNotification}>
          <BellIcon
            width={28}
            height={28}
            stroke={semanticColor.icon.primary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButtonWrapper} onPress={onPressSearch}>
          <SearchIcon
            width={28}
            height={28}
            stroke={semanticColor.icon.primary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingLeft: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  homeHeaderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    height: 20,
  },
  iconWrapper: {
    flexDirection: 'row',
  },
  iconButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: 44,
    height: 44,
  },
});

export default HomeHeader;
