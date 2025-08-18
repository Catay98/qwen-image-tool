declare global {
  interface Window {
    fbq?: Function;
    'ga-disable-GA_MEASUREMENT_ID'?: boolean;
    google_conversion_id?: any;
  }
}

export {};