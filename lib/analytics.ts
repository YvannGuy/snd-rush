// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

/**
 * Track page view
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-PGDMSHYT2H', {
      page_path: url,
    });
  }
};

/**
 * Track custom events
 */
export const trackEvent = (action: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

/**
 * Track assistant events
 */
export const trackAssistantEvent = {
  started: () => {
    trackEvent('widget_started', { 
      event_category: 'assistant' 
    });
  },
  
  packRecommended: (packName: string, confidence: number) => {
    trackEvent('pack_recommended', { 
      event_category: 'assistant',
      pack_name: packName,
      confidence: confidence
    });
  },
  
  reservationClicked: (packName: string, bookingType: 'info' | 'deposit') => {
    trackEvent('reservation_clicked', { 
      event_category: 'conversion',
      pack_name: packName,
      booking_type: bookingType
    });
  },
  
  reservationCompleted: (packName: string, totalPrice: number) => {
    trackEvent('reservation_completed', { 
      event_category: 'conversion',
      pack_name: packName,
      value: totalPrice,
      currency: 'EUR'
    });
  },
  
  addToCart: (packName: string) => {
    trackEvent('add_to_cart', { 
      event_category: 'conversion',
      pack_name: packName
    });
  },
  
  expertCalled: (packName: string) => {
    trackEvent('expert_called', { 
      event_category: 'assistant',
      pack_name: packName
    });
  }
};

/**
 * Track conversion for Google Ads
 */
export const trackConversion = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-17395859907/h0GECIKj3vkaEMOD_-ZA',
    });
  }
};
