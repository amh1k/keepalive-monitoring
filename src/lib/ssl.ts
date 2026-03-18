import https from "https";
import { URL } from "url";

export interface SslCheckResult {
  status: "VALID" | "INVALID" | "EXPIRING_SOON";
  expirationDate: Date | null;
  issuer: string | null;
}

export const checkSslDetails = async (urlStr: string): Promise<SslCheckResult> => {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      if (url.protocol !== "https:") {
        return resolve({ status: "INVALID", expirationDate: null, issuer: null });
      }

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        method: "GET",
        rejectUnauthorized: false, // We want to inspect the cert even if invalid
        agent: false,
      };

      const req = https.request(options, (res) => {
        const cert = (res.socket as any).getPeerCertificate(true);

        if (!cert || Object.keys(cert).length === 0) {
          return resolve({ status: "INVALID", expirationDate: null, issuer: null });
        }

        const expirationDate = new Date(cert.valid_to);
        const issuer = cert.issuer.O || cert.issuer.CN || "Unknown Issuer";
        const now = new Date();
        const daysUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

        let status: "VALID" | "INVALID" | "EXPIRING_SOON" = "VALID";
        if (now > expirationDate) {
          status = "INVALID";
        } else if (daysUntilExpiration < 30) {
          status = "EXPIRING_SOON";
        }

        // Also check if authorized by a CA if we want strictly VALID
        // But getPeerCertificate(true) gives us the cert even if not authorized.
        // We'll trust the expiration check for now, but we could also check res.socket.authorized
        if (!(res.socket as any).authorized && status === "VALID") {
          // If it's not authorized by a CA (e.g. self-signed), it's technically invalid for public web
          status = "INVALID";
        }

        resolve({ status, expirationDate, issuer });
      });

      req.on("error", (e) => {
        resolve({ status: "INVALID", expirationDate: null, issuer: null });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ status: "INVALID", expirationDate: null, issuer: null });
      });

      req.setTimeout(5000);
      req.end();
    } catch (error) {
      resolve({ status: "INVALID", expirationDate: null, issuer: null });
    }
  });
};
