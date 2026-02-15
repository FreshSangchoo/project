import { StyleSheet, View } from "react-native"

import SunoPig from '../../assets/sunoPig.svg';
import { colors } from "../../constants/colors";

function Card(){
    return (
        <View style={styles.container}>
            <SunoPig style={styles.pig} />
        </View>
    )
}

const styles=StyleSheet.create({
    container: {
        width: 56,
        height: 80,
        backgroundColor: colors.YELLOW_75, 
        borderRadius: 13,
        elevation: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pig: {
        
    }
});

export default Card;