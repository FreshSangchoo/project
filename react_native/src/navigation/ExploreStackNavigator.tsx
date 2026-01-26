import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '@/navigation/types/explore-stack';
import ExplorePage from '@/pages/explore/ExplorePage';
import ExploreSearchPage from '@/pages/explore/ExploreSearchPage';
import MerchandiseDetailPage from '@/pages/explore/MerchandiseDetailPage';
import ModelPage from '@/pages/explore/ModelPage';
import BrandPage from '@/pages/explore/BrandPage';
import SellerPage from '@/pages/explore/SellerPage';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

function ExploreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExplorePage" component={ExplorePage} />
      <Stack.Screen name="ExploreSearchPage" component={ExploreSearchPage} />
      <Stack.Screen name="MerchandiseDetailPage" component={MerchandiseDetailPage} />
      <Stack.Screen name="ModelPage" component={ModelPage} />
      <Stack.Screen name="BrandPage" component={BrandPage} />
      <Stack.Screen name="SellerPage" component={SellerPage} />
    </Stack.Navigator>
  );
}

export default ExploreStackNavigator;
