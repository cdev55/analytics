class Analytics {
  constructor(apiKey, config) {
    this.apiKey = apiKey;
    this.endpoint =
      config.analyticsGatewayEndpoint || 'http://localhost:5000/events';
    this.trackPageVisit = config.trackPageVisit !== false; // Default to true

    this._getIp();

    if (this.trackPageVisit) {
      this._trackInitialPageVisit();
      this._setupHistoryListener();
    }
  }

  /** Get User's IP Address */
  _getIp() {
    if (!sessionStorage.getItem('analytics_u')) {
      try {
        fetch('https://echoip.mogiio.com/json')
          .then(response => response.json())
          .then(data => {
            const userId = `user-${data.ip}`;
            sessionStorage.setItem('analytics_u', userId);
          })
          .catch(error => console.error('Error:', error));
      } catch (e) {
        console.error('Error retrieving IP', e);
      }
    }
  }

  /** Track an Event (Send via Beacon) */
  track(eventName, properties = {}) {
    console.log('Tracking Event:', eventName);

    const appId = localStorage.getItem('appId') || 'APP_ID';
    const userId = sessionStorage.getItem('analytics_u') || 'USER_NULL';

    const event = {
      appId,
      userId,
      apiKey: this.apiKey,
      eventType: eventName,
      properties,
      eventTime: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this._sendEvent(event);
  }

  /** Send Event Asynchronously */
  _sendEvent(event) {
    try {
      // const headers = {
      //   type: 'application/json',
      // };
      // const blob = new Blob([JSON.stringify(event)]);
      // console.log(45454,[JSON.stringify(event)]);
      navigator.sendBeacon(this.endpoint, JSON.stringify(event));
    } catch (error) {
      console.error('sendBeacon failed, using fetch instead', error);
      fetch(this.endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(event),
      }).catch(err => console.error('Fetch fallback failed', err));
    }
  }

  /** Track Initial Page Visit */
  _trackInitialPageVisit() {
    if (!sessionStorage.getItem('platformVisitTracked')) {
      this.track('plt_visit', {
        path: window.location.pathname,
        title: document.title,
      });
      sessionStorage.setItem('platformVisitTracked', 'true');
    }
  }

  /** Track SPA Navigation using History API */
  _setupHistoryListener() {
    console.log('Initializing History Listener');

    let firstLoad = true;
    const trackPageVisit = () => {
      if (firstLoad) {
        firstLoad = false;
        return; // Skip the first duplicate event
      }
      this.track('pg_visit', {
        path: window.location.pathname,
        title: document.title,
      });
      // window.removeEventListener('historyChange', trackPageVisit);
      // window.removeEventListener('popstate', trackPageVisit);
    };

   

    // Wrap history.pushState & replaceState to track SPA navigation
    const wrapHistoryMethod = method => {
      console.log({method})
      const original = history[method];
      history[method] = function (...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('historyChange'));
        return result;
      };
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');

    // Listen for navigation events
    window.addEventListener('historyChange', trackPageVisit);
    window.addEventListener('popstate', trackPageVisit);

    // Track initial page load
    trackPageVisit();
  }
}

/** Global Singleton for the SDK */
window.Analytics = class extends Analytics {
  static getInstance(apiKey, config) {
    return new this(apiKey, config);
  }
};

export default window.Analytics;
