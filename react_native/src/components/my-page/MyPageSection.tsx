import { StyleSheet, Text, View } from 'react-native';
import SettingItem, { SettingItemProps } from '@/components/my-page/SettingItemRow';
import SettingToggle, { SettingToggleProps } from '@/components/my-page/SettingToggleRow';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';

export type SectionItem = ({ type: 'item' } & SettingItemProps) | ({ type: 'toggle' } & SettingToggleProps);

interface MyPageSectionProps {
  sectionTitle: string;
  sectionItems: SectionItem[];
}

function MyPageSection({ sectionTitle, sectionItems }: MyPageSectionProps) {
  return (
    <View style={style.myPageSection}>
      <View style={style.sectionTitleWrapper}>
        <Text style={style.sectionTitleText}>{sectionTitle}</Text>
      </View>
      {sectionItems.map(item => {
        if (item.type === 'item') {
          return <SettingItem key={item.itemName} {...item} />;
        } else if (item.type === 'toggle') {
          return <SettingToggle key={item.itemName} {...item} />;
        }
      })}
    </View>
  );
}

const style = StyleSheet.create({
  myPageSection: {
    paddingVertical: semanticNumber.spacing[16],
  },
  sectionTitleWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[12],
  },
  sectionTitleText: {
    ...semanticFont.body.smallStrong,
    color: semanticColor.text.lightest,
  },
});

export default MyPageSection;
