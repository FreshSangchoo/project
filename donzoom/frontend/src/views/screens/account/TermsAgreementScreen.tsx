import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

interface AgreementState {
  allAgreed: boolean;
  termsOfService: boolean;
  privacyPolicy: boolean;
  dataUsage: boolean;
}

interface AgreementItemProps {
  title: string;
  agreed: boolean;
  onToggle: () => void;
}

const TermsAgreementScreen = ({navigation}: any) => {
  const [agreements, setAgreements] = useState<AgreementState>({
    allAgreed: false,
    termsOfService: false,
    privacyPolicy: false,
    dataUsage: false,
  });

  const toggleAgreement = (key: keyof AgreementState): void => {
    if (key === 'allAgreed') {
      const newValue = !agreements.allAgreed;
      setAgreements({
        allAgreed: newValue,
        termsOfService: newValue,
        privacyPolicy: newValue,
        dataUsage: newValue,
      });
    } else {
      setAgreements(prev => {
        const newAgreements = {...prev, [key]: !prev[key]};
        const allChecked = Object.keys(newAgreements).every(
          k => k === 'allAgreed' || newAgreements[k as keyof AgreementState],
        );
        return {...newAgreements, allAgreed: allChecked};
      });
    }
  };

  const handleContinue = (): void => {
    if (
      agreements.termsOfService &&
      agreements.privacyPolicy &&
      agreements.dataUsage
    ) {
      console.log('All terms agreed. Proceeding to next step.');
      navigation.navigate('비밀번호설정');
    } else {
      console.log('Please agree to all terms to continue.');
    }
  };

  const AgreementItem: React.FC<AgreementItemProps> = ({
    title,
    agreed,
    onToggle,
  }) => (
    <View style={styles.agreementItem}>
      <Text style={styles.agreementText}>{title}</Text>
      <Switch
        value={agreed}
        onValueChange={onToggle}
        trackColor={{false: '#767577', true: colors.YELLOW_100}}
        thumbColor={agreed ? colors.YELLOW_100 : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>계좌 개설 약관 동의</Text>

        <AgreementItem
          title="모든 약관에 동의합니다"
          agreed={agreements.allAgreed}
          onToggle={() => toggleAgreement('allAgreed')}
        />

        <View style={styles.separator} />

        <AgreementItem
          title="이용약관 동의 (필수)"
          agreed={agreements.termsOfService}
          onToggle={() => toggleAgreement('termsOfService')}
        />

        <AgreementItem
          title="개인정보 처리방침 동의 (필수)"
          agreed={agreements.privacyPolicy}
          onToggle={() => toggleAgreement('privacyPolicy')}
        />

        <AgreementItem
          title="데이터 사용 동의 (필수)"
          agreed={agreements.dataUsage}
          onToggle={() => toggleAgreement('dataUsage')}
        />
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          {
            backgroundColor:
              agreements.termsOfService &&
              agreements.privacyPolicy &&
              agreements.dataUsage
                ? colors.YELLOW_100
                : '#A0A0A0',
          },
        ]}
        onPress={handleContinue}>
        <Text style={styles.continueButtonText}>계속하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    textAlign: 'center',
  },
  agreementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  agreementText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  continueButton: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: fonts.MEDIUM,
  },
});

export default TermsAgreementScreen;
