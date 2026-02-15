import {useEffect, useCallback} from 'react';
import {Stomp} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type OnMessageType = (message: string, stockId?: number) => void;

const useWebSocket = (stockIds: number[], onMessage: OnMessageType) => {
  const connect = useCallback(() => {
    if (!stockIds || stockIds.length === 0) return;

    const socketUrl = 'https://j11a108.p.ssafy.io/api/websocket';
    // const socketUrl = 'http://localhost:8081/api/websocket';
    const socket = new SockJS(socketUrl);
    const client = Stomp.over(() => socket);

    client.debug = str => {
      console.log(str); // STOMP 클라이언트의 디버그 메시지 출력
    };

    client.reconnectDelay = 5000;

    const onConnect = () => {
      console.log('STOMP 연결 성공');

      stockIds.forEach((stockId: number) => {
        const subscription = client.subscribe(
          `/topic/stock/${stockId}`,
          message => {
            if (message.body) {
              console.log(
                `Received message for stock ${stockId}:`,
                message.body,
              );
              onMessage(message.body, stockId);
            }
          },
        );
        console.log(`Subscribed to /topic/stock/${stockId}`);
      });
    };

    const onError = (error: any) => {
      console.error('STOMP 연결 에러:', error);
      // 연결 재시도 로직을 여기에 추가할 수 있습니다.
    };

    client.connect({}, onConnect, onError);

    return () => {
      if (client.connected) {
        console.log('Disconnecting STOMP client...');
        client.disconnect(() => {
          console.log('STOMP 연결 종료');
        });
      }
    };
  }, [stockIds, onMessage]);

  useEffect(() => {
    const disconnect = connect();
    return () => {
      if (disconnect) disconnect();
    };
  }, [connect]);
};

export default useWebSocket;
