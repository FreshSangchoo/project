import { forwardRef } from 'react';
import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import IconSearch from '@/assets/icons/IconSearch.svg';

/**
 * 검색 입력 컴포넌트입니다.
 * 사용자가 키보드에서 Enter를 누르거나 돋보기를 클릭하면 검색 이벤트가 실행됩니다.
 *
 * @component SearchField
 * @param {'small' | 'large'} [size='large'] - 컴포넌트의 세로 패딩 크기를 설정합니다.
 * @param {string} placeholder - 입력창에 표시할 플레이스홀더 텍스트입니다.
 * @param {string} inputText - 현재 입력된 검색어 값입니다.
 * @param {React.Dispatch<React.SetStateAction<string>>} setInputText - 입력값을 업데이트하는 상태 변경 함수입니다.
 * @param {() => void} onPress - 사용자가 검색 아이콘을 클릭하거나 Enter 키를 누를 때 호출되는 함수입니다.
 * @param {boolean} isNavigate - 검색 페이지로 이동시 텍스트 입력 필드를 막아주는 역할을 합니다.
 * @param {boolean} isExplore - 특정 페이지에서 Enter로만 검색을 할 수 있게 해주는 역할을 합니다.
 * @param {React.RefObject<TextInput>} [ref] - TextInput에 대한 참조. 자동 포커스나 프로그래밍 방식 제어가 필요할 때 사용합니다.
 *
 * @example
 * // 기본 사용법
 * const [searchText, setSearchText] = useState('');
 *
 * <SearchField
 *   size="large"
 *   placeholder="어떤 악기를 찾고 있나요?"
 *   inputText={searchText}
 *   setInputText={setSearchText}
 *   onPress={() => console.log(searchText)}
 * />
 *
 * @example
 * // ref를 사용한 포커스 제어
 * const searchRef = useRef<TextInput>(null);
 *
 * useEffect(() => {
 *   searchRef.current?.focus(); // 자동 포커스
 * }, []);
 *
 * <SearchField
 *   ref={searchRef}
 *   placeholder="검색어를 입력하세요"
 *   inputText={searchText}
 *   setInputText={setSearchText}
 *   onPress={handleSearch}
 * />
 *
 * @author 김서윤
 */

interface SearchFieldProps {
  size?: 'small' | 'large';
  placeholder: string;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  onPress: () => void;
  isNavigate?: boolean;
  isExplore?: boolean;
  autoFocus?: boolean;
}

const SearchField = forwardRef<TextInput, SearchFieldProps>(
  ({ size = 'large', placeholder, inputText, setInputText, onPress, isNavigate, isExplore, autoFocus }, ref) => {
    const dynamicStyle = {
      paddingVertical: size === 'large' ? semanticNumber.spacing[16] : semanticNumber.spacing[7],
    };

    const containerStyle = [styles.container, dynamicStyle];

    return (
      <View style={containerStyle}>
        <TextInput
          ref={ref}
          value={inputText}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={semanticColor.text.lightest}
          onChangeText={text => {
            if (!isExplore) {
              setInputText(text);
            } else {
              setInputText(text);
            }
          }}
          editable={!isNavigate}
          onSubmitEditing={onPress}
          pointerEvents={isNavigate ? 'none' : 'auto'}
          autoFocus={autoFocus}
          textContentType="none"
          {...(Platform.OS === 'android' && {
            autoCorrect: false,
            autoComplete: 'off',
          })}
        />
        <IconSearch
          width={20}
          height={20}
          stroke={semanticColor.icon.lightest}
          strokeWidth={semanticNumber.stroke.bold}
          onPress={onPress}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: semanticNumber.spacing[8],
    paddingVertical: semanticNumber.spacing[16],
    paddingHorizontal: semanticNumber.spacing[12],
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.family.regular,
    fontSize: fonts.size.MD,
    padding: 0,
    textAlignVertical: 'center',
  },
});

export default SearchField;
