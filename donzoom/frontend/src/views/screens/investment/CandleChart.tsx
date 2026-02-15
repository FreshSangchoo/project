import React, {useMemo} from 'react';
import {View, Text, processColor, Dimensions} from 'react-native';
import {
  CandleStickChart,
  CandleStickData,
  CandleStickDataset,
} from 'react-native-charts-wrapper';

interface CandleData {
  x: string; // ISO 8601 형식의 날짜 문자열
  shadowH: number;
  shadowL: number;
  open: number;
  close: number;
}

interface CandlestickChartComponentProps {
  data: CandleData[];
}

const CandlestickChartComponent: React.FC<CandlestickChartComponentProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    console.log('No data available');
    return <Text>No data available</Text>;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  };

  const {processedData, dateLabels} = useMemo(() => {
    const processed = data.map((item, index) => ({
      x: index,
      shadowH: item.shadowH,
      shadowL: item.shadowL,
      open: item.open,
      close: item.close,
    }));
    const labels = data.map(item => formatDate(item.x));
    return {processedData: processed, dateLabels: labels};
  }, [data]);

  const chartData: CandleStickData = {
    dataSets: [
      {
        values: processedData,
        label: 'Stock Data',
        config: {
          highlightColor: processColor('darkgray'),
          shadowColor: processColor('black'),
          shadowWidth: 1,
          shadowColorSameAsCandle: true,
          increasingColor: processColor('blue'),
          increasingPaintStyle: 'FILL',
          decreasingColor: processColor('red'),
          drawValues: false,
        },
      } as CandleStickDataset,
    ],
  };

  const screenWidth = Dimensions.get('window').width;
  const visibleRange = Math.floor(screenWidth / 10); // 화면 너비에 따라 보이는 데이터 포인트 수 조정

  return (
    <View style={{flex: 1}}>
      <CandleStickChart
        style={{flex: 1}}
        data={chartData}
        xAxis={{
          valueFormatter: dateLabels,
          position: 'BOTTOM',
          granularityEnabled: true,
          granularity: 1,
          labelCount: 5,
          labelRotationAngle: 0,
          avoidFirstLastClipping: true,
          axisLineColor: processColor('rgba(0,0,0,0.5)'),
          textColor: processColor('gray'),
          gridColor: processColor('rgba(0,0,0,0.1)'),
        }}
        yAxis={{
          left: {enabled: false},
          right: {
            enabled: true,
            axisLineColor: processColor('rgba(0,0,0,0.5)'),
            textColor: processColor('gray'),
            gridColor: processColor('rgba(0,0,0,0.1)'),
          },
        }}
        maxVisibleValueCount={16}
        autoScaleMinMaxEnabled={true}
        visibleRange={{x: {min: visibleRange, max: visibleRange}}}
        // dragXEnabled={true}
        scaleXEnabled={true}
        scaleYEnabled={true}
        pinchZoom={true}
        doubleTapToZoomEnabled={false}
        dragDecelerationEnabled={true}
        dragDecelerationFrictionCoef={0.99}
        keepPositionOnRotation={false}
        zoom={{
          scaleX: 1,
          scaleY: 1,
          xValue: processedData.length - 1,
          yValue: 0,
          axisDependency: 'RIGHT',
        }}
        chartDescription={{text: ''}} // 차트 설명 제거
        legend={{enabled: false}} // 범례 제거
        drawBorders={false} // 테두리 제거
      />
    </View>
  );
};

export default CandlestickChartComponent;
export type {CandleData};
