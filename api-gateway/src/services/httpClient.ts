import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ServiceDiscovery } from './serviceDiscovery';

export class HTTPClient {
  private client: AxiosInstance;
  
  constructor(serviceName: string) {
    const config = ServiceDiscovery.getServiceConfig(serviceName);
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Gateway': 'campfire-ads'
      }
    });
    
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }
        
        if (config.retry < ServiceDiscovery.getServiceConfig(serviceName).maxRetries) {
          config.retry += 1;
          
          await new Promise(resolve => 
            setTimeout(resolve, ServiceDiscovery.getServiceConfig(serviceName).retryDelay)
          );
          
          return this.client(config);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }
  
  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }
  
  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(url, data, config);
  }
  
  async delete(url: string, config?: AxiosRequestConfig) {
    return this.client.delete(url, config);
  }
}