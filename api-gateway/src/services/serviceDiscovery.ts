export class ServiceDiscovery {
  static getServiceURL(serviceName: string): string {
    const services = {
      inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004',
      analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3002',
      audio: process.env.AUDIO_SERVICE_URL || 'http://localhost:8081',
      rss: process.env.RSS_SERVICE_URL || 'http://localhost:3003',
      rtb: process.env.RTB_ENGINE_URL || 'http://localhost:8080',
      tracking: process.env.TRACKING_SERVICE_URL || 'http://localhost:3006'
    };
    
    return services[serviceName as keyof typeof services] || '';
  }
  
  static getServiceConfig(serviceName: string) {
    const baseURL = this.getServiceURL(serviceName);
    
    return {
      baseURL,
      timeout: parseInt(process.env.SERVICE_TIMEOUT_MS || '5000'),
      maxRetries: parseInt(process.env.SERVICE_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.SERVICE_RETRY_DELAY_MS || '1000')
    };
  }
}
