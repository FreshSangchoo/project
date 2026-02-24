declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    image?: MarkerImage;
  }

  class MarkerImage {
    constructor(src: string, size: Size);
  }

  class Size {
    constructor(width: number, height: number);
  }

  function load(callback: () => void): void;

  namespace event {
    function addListener(target: Map | Marker, type: string, handler: () => void): void;
    function removeListener(target: Map | Marker, type: string, handler: () => void): void;
  }

  namespace services {
    class Geocoder {
      addressSearch(
        address: string,
        callback: (result: AddressSearchResult[], status: Status) => void
      ): void;
    }

    interface AddressSearchResult {
      y: string;
      x: string;
      address_name: string;
      road_address: RoadAddress;
    }

    interface RoadAddress {
      building_name: string;
      main_building_no: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      sub_building_no: string;
      underground_yn: string;
      zone_no: string;
    }

    type Status = 'OK' | 'ZERO_RESULT' | 'ERROR';
    const Status: {
      OK: Status;
      ZERO_RESULT: Status;
      ERROR: Status;
    };
  }
}
