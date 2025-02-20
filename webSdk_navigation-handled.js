class Analytics {
  constructor(apiKey, config) {
    this.apiKey = apiKey;
    this.endpoint =
      config.analyticsGatewayEndpoint || 'http://localhost:5000/events';
    this.queueKey = 'analyticsEventQueue';
    this.queue = this._getQueue();
    this.batchSize = config.batchSize || 10;
    this.sending = false;
    this.trackPageVisit = config.trackPageVisit !== false;
    this.eventObj = {
      userId: 'goluBoy',
      eventType: 'pageVisit',
      eventTime: new Date().toISOString(),
      eventProperties: {},
      userAgent: '',
      url: '',
    };

    this._getIp();

    if (this.trackPageVisit) {
      this._trackInitialPageVisit();
      this._setupHistoryListener(); // New: Track SPA navigation
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
        console.error('Error retrieving queue from localStorage', e);
      }
    }
  }

  /** Retrieve Event Queue from LocalStorage */
  _getQueue() {
    try {
      const storedQueue = localStorage.getItem(this.queueKey);
      return storedQueue ? JSON.parse(storedQueue) : [];
    } catch (e) {
      console.error('Error retrieving queue from localStorage', e);
      return [];
    }
  }

  /** Save Event Queue to LocalStorage */
  _saveQueue() {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Error saving queue to localStorage', e);
    }
  }

  /** Track an Event */
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

    this.queue.push(event);
    this._saveQueue();

    if (this.queue.length >= this.batchSize && !this.sending) {
      this._sendEvents();
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
    console.log('historyListener');
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
    };

    // Wrap history.pushState and history.replaceState
    const wrapHistoryMethod = method => {
      const original = history[method];
      history[method] = function (...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event('historyChange'));
        return result;
      };
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');

    // Listen for history change events
    window.addEventListener('historyChange', trackPageVisit);

    // Listen for back/forward navigation
    window.addEventListener('popstate', trackPageVisit);

    // Track initial page load
    trackPageVisit();

    // setTimeout(() => {
    //   trackPageVisit();
    // }, 0);
  }

  /** Send Events to Backend */
  _sendEvents() {
    if (this.sending || this.queue.length === 0) return;

    this.sending = true;
    const batch = this.queue.splice(0, this.batchSize);
    this._saveQueue();

    fetch(this.endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(batch),
    })
      .then(response => {
        if (!response.ok) {
          console.error('Analytics: Error sending events', response.status);
          this.queue = batch.concat(this.queue); // Re-add events to queue
          this._saveQueue();
        }
      })
      .catch(error => {
        console.error('Analytics: Network error sending events', error);
        this.queue = batch.concat(this.queue);
        this._saveQueue();
      })
      .finally(() => {
        this.sending = false;
        if (this.queue.length > 0) this._sendEvents(); // Process next batch
      });
  }
}

/** Global Singleton for the SDK */
window.Analytics = class extends Analytics {
  static getInstance(apiKey, config) {
    return new this(apiKey, config);
  }
};

export default window.Analytics;
