import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, View } from 'react-native';
import FeatureProductCard from './content/FeatureProductCard';
import WishListCard from './content/WishListCard';
import NoticeCard from './content/NoticeCard';

interface CardContainerProps {
  onPress: () => void;
}

const CardContainer = ({ onPress }: CardContainerProps) => {
  return (
    <View style={styles.container}>
      <FeatureProductCard />
      <WishListCard onPress={onPress} />
      <NoticeCard />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: semanticNumber.spacing.none,
    paddingRight: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[40],
    paddingLeft: semanticNumber.spacing[16],
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[20],
  },
});
export default CardContainer;
