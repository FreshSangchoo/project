import { colors } from "@/constants/colors";
import { fonts } from "@/constants/font";
import KeyPad from "@/views/components/KeyPad";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FontAwesome from 'react-native-vector-icons/FontAwesome'

export default function TransferScreen4() {
  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.pwdHeaderText}>비밀번호를 입력해주세요</Text>
        <View style={styles.pwdInputContainer}>
          <FontAwesome
            name="circle"
            size={20}
            style={styles.pwdCircle}
          ></FontAwesome>
          <FontAwesome
            name="circle"
            size={20}
            style={styles.pwdCircle}
          ></FontAwesome>
          <FontAwesome
            name="circle"
            size={20}
            style={styles.pwdCircle}
          ></FontAwesome>
          <FontAwesome
            name="circle"
            size={20}
            style={styles.pwdCircle}
          ></FontAwesome>
          <FontAwesome
            name="circle"
            size={20}
            style={styles.pwdCircle}
          ></FontAwesome>
          <FontAwesome
            name="circle"
            size={20}
            style={styles.pwdCircle}
          ></FontAwesome>
        </View>
        <View style={styles.pwdFindContainer}>
          <Text style={styles.pwdFindText}>비밀번호를 잊어버렸어요!</Text>
        </View>
      </View>
      <KeyPad onInput={function (value: number): void {
        throw new Error("Function not implemented.");
      }} currentValue={0}>

      </KeyPad>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // 화면 전체를 차지하도록 설정
    justifyContent: 'flex-start', // 내용이 화면 상단에 위치하도록 설정
    alignItems: 'stretch', // 자식 컴포넌트가 화면의 가로를 채우도록 설정
    backgroundColor: colors.YELLOW_25,
  },
  topContainer:{
    flexGrow:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:colors.WHITE,
  },
  pwdHeaderText:{
    fontFamily:fonts.MEDIUM,
    fontSize:20,
    marginBottom:20,
  },
  pwdInputContainer:{
    flexDirection:'row',
  },
  pwdFindContainer:{
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:colors.GRAY_25,
    width:164,
    height:28,
    borderRadius:8,
    marginTop:30,
  },
  pwdCircle:{
    marginHorizontal:13,
  },
  pwdFindText:{
    fontFamily:fonts.MEDIUM,
    fontSize:12,
    color:colors.BLACK,
  },

});
