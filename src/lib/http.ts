import axios from "axios";
import http from "http";
import https from "https";
export const httpClient = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  validateStatus: (status) => status < 500,
});
